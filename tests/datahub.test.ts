import { describe, it, expect } from "vitest"
import { nodeUrn, parseNodeUrn, corpUserUrn, tagUrn } from "@/lib/datahub/urn"
import { blastRadius } from "@/lib/datahub/impact"
import { buildTwinAspects } from "@/lib/datahub/emit"
import { buildGroundedRationale } from "@/lib/datahub/rationale"
import { nodeUrn as urnOf } from "@/lib/datahub/urn"
import { DEMO_TWIN, DEMO_TWIN_ID, isDemoNodeId } from "@/lib/datahub/demo-twin"
import { rerouteAroundNode } from "@/lib/routing"
import type { TwinGraph } from "@/lib/datahub/types"

// A small chain:  S(supplier) → F(factory) → W(warehouse) → R(retailer)
//                                 └────────→ D(distribution)
const twin: TwinGraph = {
  supplyChainId: "sc1",
  nodes: [
    { id: "S", name: "Supplier", type: "Supplier", owner: "alice@acme.co", risk: 80 },
    { id: "F", name: "Factory", type: "Factory", owner: "bob" },
    { id: "W", name: "Warehouse", type: "Warehouse" },
    { id: "R", name: "Retailer", type: "Retailer", owner: "carol" },
    { id: "D", name: "DC", type: "Distribution" },
  ],
  edges: [
    { source: "S", target: "F" },
    { source: "F", target: "W" },
    { source: "W", target: "R" },
    { source: "F", target: "D" },
  ],
}

describe("urn", () => {
  it("builds and parses node URNs round-trip", () => {
    const urn = nodeUrn("sc1", "node-42")
    expect(urn).toBe("urn:li:dataset:(urn:li:dataPlatform:reroute,sc1.node-42,PROD)")
    expect(parseNodeUrn(urn)).toEqual({ supplyChainId: "sc1", nodeId: "node-42" })
  })

  it("returns null parsing a non-node URN", () => {
    expect(parseNodeUrn("urn:li:tag:foo")).toBeNull()
  })

  it("derives corpuser from an email local-part", () => {
    expect(corpUserUrn("alice@acme.co")).toBe("urn:li:corpuser:alice")
    expect(corpUserUrn("bob")).toBe("urn:li:corpuser:bob")
  })

  it("builds tag URNs", () => {
    expect(tagUrn("reroute-at-risk")).toBe("urn:li:tag:reroute-at-risk")
  })
})

describe("blastRadius", () => {
  it("finds all downstream nodes with correct hop distances", () => {
    const b = blastRadius(twin, "S")
    const ids = b.impacted.map((n) => n.id).sort()
    expect(ids).toEqual(["D", "F", "R", "W"]) // everything downstream of S
    const hops = Object.fromEntries(b.impacted.map((n) => [n.id, n.hops]))
    expect(hops).toEqual({ F: 1, W: 2, D: 2, R: 3 })
  })

  it("does not include upstream or the failed node itself", () => {
    const b = blastRadius(twin, "W")
    expect(b.impacted.map((n) => n.id)).toEqual(["R"]) // only R is downstream of W
  })

  it("ranks a nearer retailer above a farther one by severity", () => {
    const b = blastRadius(twin, "F")
    // R is a retailer (weight 5) at 2 hops; D is distribution (weight 4) at 1 hop.
    // sev(D)=4·0.6=2.4 ; sev(R)=5·0.36=1.8 → D outranks R.
    expect(b.impacted[0].id).toBe("D")
  })

  it("collects distinct affected owners", () => {
    const b = blastRadius(twin, "S")
    expect(b.affectedOwners).toEqual(["bob", "carol"]) // F→bob, R→carol; W/D unowned
  })

  it("is empty for a leaf node", () => {
    expect(blastRadius(twin, "R").impacted).toEqual([])
  })
})

describe("buildTwinAspects", () => {
  const aspects = buildTwinAspects(twin)

  it("emits DatasetProperties for every node with custom properties", () => {
    const props = aspects.filter((a) => a.aspect.__type === "DatasetProperties")
    expect(props).toHaveLength(5)
    const supplier = props.find((a) => a.entityUrn === nodeUrn("sc1", "S"))!
    expect((supplier.aspect as any).customProperties).toMatchObject({ type: "Supplier", risk: "80" })
  })

  it("emits Ownership only for owned nodes", () => {
    const owns = aspects.filter((a) => a.aspect.__type === "Ownership")
    expect(owns).toHaveLength(3) // S, F, R have owners; W, D do not
    const s = owns.find((a) => a.entityUrn === nodeUrn("sc1", "S"))!
    expect((s.aspect as any).owners[0].owner).toBe("urn:li:corpuser:alice")
  })

  it("emits UpstreamLineage pointing at the source dataset", () => {
    const lineage = aspects.filter((a) => a.aspect.__type === "UpstreamLineage")
    // F, W, R, D each have exactly one upstream.
    expect(lineage).toHaveLength(4)
    const f = lineage.find((a) => a.entityUrn === nodeUrn("sc1", "F"))!
    expect((f.aspect as any).upstreams[0].dataset).toBe(nodeUrn("sc1", "S"))
  })

  it("creates the governance domain and assigns every node to it", () => {
    const domain = aspects.filter((a) => a.aspect.__type === "DomainProperties")
    expect(domain).toHaveLength(1)
    const assignments = aspects.filter((a) => a.aspect.__type === "Domains")
    expect(assignments).toHaveLength(5) // every node
    expect((assignments[0].aspect as any).domains).toEqual(["urn:li:domain:reroute-supply-chain"])
  })

  it("creates corpUser profiles for each distinct owner", () => {
    const users = aspects.filter((a) => a.aspect.__type === "CorpUserInfo")
    expect(users).toHaveLength(3) // alice, bob, carol
    const alice = users.find((a) => a.entityUrn === "urn:li:corpuser:alice")!
    expect((alice.aspect as any).email).toBe("alice@acme.co")
  })
})

describe("buildGroundedRationale", () => {
  it("grounds every claim in a DataHub URN", () => {
    const b = blastRadius(twin, "S")
    const r = buildGroundedRationale(twin, b)
    expect(r.claims.length).toBeGreaterThan(0)
    for (const c of r.claims) {
      expect(c.urn).toMatch(/^urn:li:dataset:\(urn:li:dataPlatform:reroute,/)
    }
    // First claim is grounded in the failed node itself.
    expect(r.claims[0].urn).toBe(urnOf("sc1", "S"))
  })

  it("is high-confidence and routable when typed + owned downstream exists", () => {
    const r = buildGroundedRationale(twin, blastRadius(twin, "S"))
    // hasLineage + allTyped + routable → 0.4+0.2+0.2+0.2 = 1.0
    expect(r.confidence).toBe(1)
    expect(r.needsReview).toBe(false)
    expect(r.ownersToNotify).toEqual(["bob", "carol"])
  })

  it("flags needs-review when impact is contained (leaf node)", () => {
    const r = buildGroundedRationale(twin, blastRadius(twin, "R"))
    // no lineage, no owners → 0.4 confidence → below 0.6 threshold
    expect(r.confidence).toBeLessThan(0.6)
    expect(r.needsReview).toBe(true)
  })

  it("cites the best feasible reroute, grounded in the segment's URN", () => {
    const toRaw = (g: TwinGraph) => ({
      nodes: g.nodes.map((n) => ({ id: n.id, label: n.name ?? n.id })),
      edges: g.edges,
    })
    const raw = toRaw(DEMO_TWIN)
    const rr = rerouteAroundNode(raw.nodes, raw.edges, "port-sg")
    const blast = blastRadius(DEMO_TWIN, "port-sg")
    const r = buildGroundedRationale(DEMO_TWIN, blast, rr)

    const best = rr.reroutes.find((x) => x.feasible)!
    expect(best).toBeTruthy() // the air-freight lane makes at least one segment recoverable
    const rerouteClaim = r.claims.find((c) => c.text.startsWith("Alternate route:"))!
    expect(rerouteClaim).toBeTruthy()
    expect(rerouteClaim.urn).toBe(urnOf(DEMO_TWIN_ID, best.from))
    expect(r.summary).toContain("Reroute available")
  })

  it("states when no feasible reroute exists", () => {
    // In the small `twin` fixture, W has one pred (F) and one succ (R) but no
    // alternate path F→R avoiding W — every broken segment is severed.
    const raw = { nodes: twin.nodes.map((n) => ({ id: n.id, label: n.name ?? n.id })), edges: twin.edges }
    const rr = rerouteAroundNode(raw.nodes, raw.edges, "W")
    expect(rr.feasibleCount).toBe(0)
    const r = buildGroundedRationale(twin, blastRadius(twin, "W"), rr)
    expect(r.claims.some((c) => c.text.includes("No feasible alternate route"))).toBe(true)
    expect(r.summary).toContain("No feasible reroute")
  })
})

describe("demo twin", () => {
  it("recognises demo node ids", () => {
    expect(isDemoNodeId("port-sg")).toBe(true)
    expect(isDemoNodeId("nonexistent")).toBe(false)
  })

  it("has full redundancy value: every mid-chain failure leaves retailers reachable or flagged", () => {
    const blast = blastRadius(DEMO_TWIN, "wafer-tw")
    // Failing the risky Taiwan fab impacts both retail networks downstream.
    const ids = blast.impacted.map((n) => n.id)
    expect(ids).toContain("retail-eu")
    expect(ids).toContain("retail-us")
    // But the Korea fab is NOT impacted (it's a parallel supplier).
    expect(ids).not.toContain("wafer-kr")
  })

  it("port-sg failure has a feasible air-freight reroute to the US", () => {
    const raw = { nodes: DEMO_TWIN.nodes.map((n) => ({ id: n.id, label: n.name ?? n.id })), edges: DEMO_TWIN.edges }
    const rr = rerouteAroundNode(raw.nodes, raw.edges, "port-sg")
    expect(rr.feasibleCount).toBeGreaterThan(0) // subcon-my → air-hk → dc-us
    expect(rr.infeasibleCount).toBeGreaterThan(0) // no alternate to dc-nl → High severity story
    expect(rr.severity).toBe("High")
  })
})
