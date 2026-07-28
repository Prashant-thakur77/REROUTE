import { describe, it, expect } from "vitest"
import { nodeUrn, parseNodeUrn, corpUserUrn, tagUrn } from "@/lib/datahub/urn"
import { blastRadius } from "@/lib/datahub/impact"
import { buildTwinAspects } from "@/lib/datahub/emit"
import { buildGroundedRationale } from "@/lib/datahub/rationale"
import { nodeUrn as urnOf } from "@/lib/datahub/urn"
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
})
