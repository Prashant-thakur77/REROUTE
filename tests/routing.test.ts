import { describe, it, expect } from "vitest"
import { buildGraph, shortestPath, rerouteAroundNode, formatReroute, type RawNode, type RawEdge } from "@/lib/routing"

const nodes: RawNode[] = ["A", "B", "C", "D", "E"].map((id) => ({ id, label: id }))
// A→B→C→E (main), with a cheaper detour A→D→C
const edges: RawEdge[] = [
  { source: "A", target: "B", cost: 10, time: 2 },
  { source: "B", target: "C", cost: 10, time: 2 },
  { source: "A", target: "D", cost: 5, time: 3 },
  { source: "D", target: "C", cost: 8, time: 3 },
  { source: "C", target: "E", cost: 4, time: 1 },
]

describe("shortestPath", () => {
  const g = buildGraph(nodes, edges)

  it("finds the cheapest weighted path", () => {
    const p = shortestPath(g, "A", "C")! // A→D→C (13) beats A→B→C (20)
    expect(p.labels).toEqual(["A", "D", "C"])
    expect(p.cost).toBe(13)
  })

  it("respects the avoid set", () => {
    const p = shortestPath(g, "A", "C", new Set(["D"]))! // forced onto A→B→C
    expect(p.labels).toEqual(["A", "B", "C"])
    expect(p.cost).toBe(20)
  })

  it("returns null when unreachable", () => {
    expect(shortestPath(g, "E", "A")).toBeNull() // directed — no path back
  })
})

describe("rerouteAroundNode", () => {
  it("finds a feasible alternate around a failed node", () => {
    const r = rerouteAroundNode(nodes, edges, "B")
    expect(r.reroutes).toHaveLength(1)
    const only = r.reroutes[0]
    expect(only.feasible).toBe(true)
    expect(only.alternate!.labels).toEqual(["A", "D", "C"])
    // broken A→B→C = 20, alternate A→D→C = 13 → cheaper, so disruption is Low
    expect(only.addedCost).toBe(-7)
    expect(r.severity).toBe("Low")
  })

  it("reports Medium severity when the only reroute adds cost", () => {
    const n: RawNode[] = ["X", "Y", "Z", "W"].map((id) => ({ id, label: id }))
    const e: RawEdge[] = [
      { source: "X", target: "Y", cost: 5 },
      { source: "Y", target: "Z", cost: 5 },
      { source: "X", target: "W", cost: 20 },
      { source: "W", target: "Z", cost: 20 },
    ]
    const r = rerouteAroundNode(n, e, "Y") // broken X→Y→Z=10, alternate X→W→Z=40 → +30
    expect(r.reroutes[0].addedCost).toBe(30)
    expect(r.severity).toBe("Medium")
  })

  it("reports High severity when a node has no alternate", () => {
    const r = rerouteAroundNode(nodes, edges, "C") // everything funnels through C to E
    expect(r.feasibleCount).toBe(0)
    expect(r.infeasibleCount).toBeGreaterThan(0)
    expect(r.severity).toBe("High")
    expect(r.reroutes.every((x) => !x.feasible)).toBe(true)
  })

  it("formats a reroute with added cost/time", () => {
    const r = rerouteAroundNode(nodes, edges, "B")
    expect(formatReroute(r.reroutes[0])).toContain("A → D → C")
  })
})
