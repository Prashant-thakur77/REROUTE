import { describe, it, expect } from "vitest"
import { buildTwin, type Row } from "@/lib/import/twin-import"
import { rerouteAroundNode, type RawNode, type RawEdge } from "@/lib/routing"

// Integration: the CSV import pipeline feeds the routing engine end-to-end.
// A twin is built from rows, then rerouting is computed over the built graph —
// exercising twin-import + routing together, the way the app does at runtime.

function toRows(csv: string): Row[] {
  const [head, ...lines] = csv.trim().split("\n")
  const headers = head.split(",")
  return lines
    .filter((l) => l.trim())
    .map((l) => {
      const c = l.split(",")
      const o: Row = {}
      headers.forEach((h, i) => (o[h.trim()] = (c[i] ?? "").trim()))
      return o
    })
}

// Map a built twin (React Flow shapes) into the routing engine's inputs.
function toRouting(built: ReturnType<typeof buildTwin>): { nodes: RawNode[]; edges: RawEdge[] } {
  return {
    nodes: built.nodes.map((n) => ({ id: n.id, label: (n.data as any).label })),
    edges: built.edges.map((e) => ({
      source: e.source,
      target: e.target,
      cost: (e.data as any).cost,
      time: (e.data as any).transitTime,
    })),
  }
}

describe("integration: import → routing", () => {
  it("builds a twin from CSV then reports no bypass on a linear chain", () => {
    // A → B → C → D → E (linear): failing a middle node has no alternate.
    const nodes = toRows(
      "name,type\nSupplier A,Supplier\nPort B,Port\nFactory C,Factory\nDC D,Distribution\nRetail E,Retailer",
    )
    const edges = toRows(
      "source,target,cost,time\nSupplier A,Port B,10,2\nPort B,Factory C,10,2\nFactory C,DC D,10,2\nDC D,Retail E,10,2",
    )
    const twin = buildTwin(nodes, edges)
    expect(twin.errors).toHaveLength(0)

    const g = toRouting(twin)
    const r = rerouteAroundNode(g.nodes, g.edges, "factory-c")
    expect(r.feasibleCount).toBe(0)
    expect(r.severity).toBe("High")
  })

  it("finds a real bypass when the imported twin has a parallel route", () => {
    // Supplier → Port → Factory, plus a parallel Supplier → Alt Port → Factory.
    const nodes = toRows(
      "name,type\nSupplier,Supplier\nMain Port,Port\nAlt Port,Port\nFactory,Factory",
    )
    const edges = toRows(
      "source,target,cost,time\nSupplier,Main Port,10,2\nMain Port,Factory,10,2\nSupplier,Alt Port,12,3\nAlt Port,Factory,9,3",
    )
    const twin = buildTwin(nodes, edges)
    const g = toRouting(twin)
    const r = rerouteAroundNode(g.nodes, g.edges, "main-port")

    expect(r.feasibleCount).toBeGreaterThan(0)
    const alt = r.reroutes.find((x) => x.feasible)!
    expect(alt.alternate!.labels).toContain("Alt Port")
    // broken Supplier→MainPort→Factory = 20, bypass = 12+9 = 21 → +1
    expect(alt.addedCost).toBe(1)
  })

  it("carries node coordinates through import so the map has geo data", () => {
    const nodes = toRows(
      "name,type,lat,lng\nS1,Supplier,31.2,121.5\nR1,Retailer,40.7,-74.0",
    )
    const twin = buildTwin(nodes, [])
    const withCoords = twin.nodes.filter((n) => (n.data as any).lat != null)
    expect(withCoords).toHaveLength(2)
  })
})
