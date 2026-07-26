import { describe, it, expect } from "vitest"
import { buildTwin, type Row } from "@/lib/import/twin-import"
import { getGrounding } from "@/lib/grounding"
import { buildGraph, shortestPath, rerouteAroundNode, type RawNode, type RawEdge } from "@/lib/routing"

function toRows(csv: string): Row[] {
  const [head, ...lines] = csv.trim().split("\n")
  const headers = head.split(",")
  return lines.filter((l) => l.trim()).map((l) => {
    const c = l.split(",")
    const o: Row = {}
    headers.forEach((h, i) => (o[h.trim()] = (c[i] ?? "").trim()))
    return o
  })
}

describe("import edge cases", () => {
  it("matches headers case-insensitively and trims whitespace", () => {
    const r = buildTwin(toRows(" NAME , Type \nAcme, supplier"), [])
    expect(r.errors).toHaveLength(0)
    expect(r.nodes[0].type).toBe("supplierNode")
  })

  it("clamps an out-of-range risk to 0–1 with a warning", () => {
    const r = buildTwin(toRows("name,type,riskScore\nAcme,Supplier,150"), [])
    expect((r.nodes[0].data as any).riskScore).toBeLessThanOrEqual(1)
    expect(r.warnings.some((w) => w.toLowerCase().includes("risk"))).toBe(true)
  })

  it("de-duplicates repeated node ids instead of colliding", () => {
    const r = buildTwin(toRows("id,name,type\nx,A,Supplier\nx,B,Supplier"), [])
    const ids = r.nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length) // all unique
    expect(r.warnings.some((w) => w.toLowerCase().includes("duplicate"))).toBe(true)
  })

  it("errors on an edge missing a target", () => {
    const r = buildTwin(toRows("name,type\nOnly,Supplier"), toRows("source,target\nOnly,"))
    expect(r.errors.some((e) => e.toLowerCase().includes("missing source or target"))).toBe(true)
  })

  it("skips fully-blank rows without erroring", () => {
    const r = buildTwin(toRows("name,type\nAcme,Supplier\n,"), [])
    expect(r.stats.nodeCount).toBe(1)
  })
})

describe("grounding boundaries", () => {
  it("treats exactly 0.75 as high and 0.5 as medium", () => {
    expect(getGrounding({ confidence: 0.75 } as any).level).toBe("high")
    expect(getGrounding({ confidence: 0.5 } as any).level).toBe("medium")
    expect(getGrounding({ confidence: 0.49 } as any).level).toBe("low")
  })

  it("ignores sources with non-numeric credibility in the average", () => {
    const g = getGrounding({ sources: [{ credibility: 0.8 }, { credibility: "n/a" }] } as any)
    expect(g.avgCredibility).toBeCloseTo(0.8)
  })
})

describe("routing edge cases", () => {
  const nodes: RawNode[] = ["A", "B", "C"].map((id) => ({ id, label: id }))

  it("returns a zero-cost path for from === to", () => {
    const g = buildGraph(nodes, [{ source: "A", target: "B" }])
    const p = shortestPath(g, "A", "A")!
    expect(p.cost).toBe(0)
    expect(p.hops).toBe(0)
  })

  it("finds paths even when edges have no cost data (weight 0)", () => {
    const g = buildGraph(nodes, [{ source: "A", target: "B" }, { source: "B", target: "C" }])
    const p = shortestPath(g, "A", "C")!
    expect(p.labels).toEqual(["A", "B", "C"])
  })

  it("returns no reroutes when the failed node has no routes through it", () => {
    const r = rerouteAroundNode(nodes, [{ source: "A", target: "B" }], "C")
    expect(r.reroutes).toHaveLength(0)
  })

  it("produces one reroute per predecessor×successor pair", () => {
    // Two predecessors (A, B) and two successors (D, E) of failed node X.
    const n: RawNode[] = ["A", "B", "X", "D", "E"].map((id) => ({ id, label: id }))
    const e: RawEdge[] = [
      { source: "A", target: "X", cost: 1 },
      { source: "B", target: "X", cost: 1 },
      { source: "X", target: "D", cost: 1 },
      { source: "X", target: "E", cost: 1 },
    ]
    const r = rerouteAroundNode(n, e, "X")
    expect(r.reroutes).toHaveLength(4) // 2 preds × 2 succs
  })
})
