// Deterministic supply-chain routing. Given the twin's nodes/edges, compute
// real shortest paths (weighted Dijkstra) and alternate routes around a failed
// node. Correct and fast (<1ms on typical twins) — no LLM guessing the graph.

export interface RawNode { id: string; label?: string }
export interface RawEdge { source: string; target: string; cost?: number | string; time?: number | string }

const num = (x: unknown): number => {
  const n = typeof x === "number" ? x : Number(x)
  return Number.isFinite(n) ? n : 0
}

interface Graph {
  labels: Map<string, string>
  adj: Map<string, { to: string; cost: number; time: number }[]>
}

export function buildGraph(nodes: RawNode[], edges: RawEdge[]): Graph {
  const labels = new Map<string, string>()
  const adj = new Map<string, { to: string; cost: number; time: number }[]>()
  for (const n of nodes) {
    labels.set(n.id, n.label ?? n.id)
    if (!adj.has(n.id)) adj.set(n.id, [])
  }
  for (const e of edges) {
    if (!e.source || !e.target) continue
    if (!labels.has(e.source)) labels.set(e.source, e.source)
    if (!labels.has(e.target)) labels.set(e.target, e.target)
    if (!adj.has(e.source)) adj.set(e.source, [])
    if (!adj.has(e.target)) adj.set(e.target, [])
    adj.get(e.source)!.push({ to: e.target, cost: num(e.cost), time: num(e.time) })
  }
  return { labels, adj }
}

export interface PathResult {
  path: string[]
  labels: string[]
  cost: number
  time: number
  hops: number
}

/**
 * Weighted shortest path (Dijkstra) from `from` to `to`, optionally avoiding a
 * set of nodes. Directed — respects edge direction (supply flows one way).
 */
export function shortestPath(
  graph: Graph,
  from: string,
  to: string,
  avoid: Set<string> = new Set(),
  weight: "cost" | "time" = "cost",
): PathResult | null {
  if (avoid.has(from) || avoid.has(to)) return null
  if (from === to) return { path: [from], labels: [graph.labels.get(from) ?? from], cost: 0, time: 0, hops: 0 }

  const dist = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const queue = new Set<string>([from])
  const visited = new Set<string>()

  while (queue.size) {
    // Extract min-distance node (linear scan; twins are small).
    let u: string | null = null
    let best = Infinity
    for (const n of queue) {
      const d = dist.get(n) ?? Infinity
      if (d < best) { best = d; u = n }
    }
    if (u === null) break
    queue.delete(u)
    visited.add(u)
    if (u === to) break

    for (const edge of graph.adj.get(u) ?? []) {
      if (avoid.has(edge.to) || visited.has(edge.to)) continue
      const w = weight === "cost" ? edge.cost : edge.time
      const nd = (dist.get(u) ?? Infinity) + w
      if (nd < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nd)
        prev.set(edge.to, u)
        queue.add(edge.to)
      }
    }
  }

  if (!prev.has(to)) return null

  const path: string[] = []
  let cur: string | undefined = to
  while (cur !== undefined) {
    path.unshift(cur)
    if (cur === from) break
    cur = prev.get(cur)
  }
  if (path[0] !== from) return null

  let cost = 0
  let time = 0
  for (let i = 0; i < path.length - 1; i++) {
    const e = (graph.adj.get(path[i]) ?? []).find((x) => x.to === path[i + 1])
    if (e) { cost += e.cost; time += e.time }
  }
  return { path, labels: path.map((id) => graph.labels.get(id) ?? id), cost, time, hops: path.length - 1 }
}

export interface Reroute {
  from: string
  fromLabel: string
  to: string
  toLabel: string
  brokenCost: number
  brokenTime: number
  alternate: PathResult | null
  addedCost: number | null
  addedTime: number | null
  feasible: boolean
}

export interface RerouteResult {
  failedNode: string
  failedLabel: string
  reroutes: Reroute[]
  feasibleCount: number
  infeasibleCount: number
  severity: "Low" | "Medium" | "High"
}

/**
 * For a failed node, find alternate routes for each broken segment
 * (predecessor → failed node → successor), ranked by added cost.
 */
export function rerouteAroundNode(nodes: RawNode[], edges: RawEdge[], failedNodeId: string): RerouteResult {
  const graph = buildGraph(nodes, edges)
  const failedLabel = graph.labels.get(failedNodeId) ?? failedNodeId

  const preds: { id: string; cost: number; time: number }[] = []
  const succs: { id: string; cost: number; time: number }[] = []
  for (const e of edges) {
    if (e.target === failedNodeId) preds.push({ id: e.source, cost: num(e.cost), time: num(e.time) })
    if (e.source === failedNodeId) succs.push({ id: e.target, cost: num(e.cost), time: num(e.time) })
  }

  const avoid = new Set([failedNodeId])
  const reroutes: Reroute[] = []
  for (const p of preds) {
    for (const s of succs) {
      const brokenCost = p.cost + s.cost
      const brokenTime = p.time + s.time
      const alt = shortestPath(graph, p.id, s.id, avoid, "cost")
      reroutes.push({
        from: p.id,
        fromLabel: graph.labels.get(p.id) ?? p.id,
        to: s.id,
        toLabel: graph.labels.get(s.id) ?? s.id,
        brokenCost,
        brokenTime,
        alternate: alt,
        addedCost: alt ? alt.cost - brokenCost : null,
        addedTime: alt ? alt.time - brokenTime : null,
        feasible: alt !== null,
      })
    }
  }

  reroutes.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1
    return (a.addedCost ?? Infinity) - (b.addedCost ?? Infinity)
  })

  const feasibleCount = reroutes.filter((r) => r.feasible).length
  const infeasibleCount = reroutes.length - feasibleCount
  const severity: RerouteResult["severity"] =
    infeasibleCount > 0 ? "High" : reroutes.some((r) => (r.addedCost ?? 0) > 0) ? "Medium" : "Low"

  return { failedNode: failedNodeId, failedLabel, reroutes, feasibleCount, infeasibleCount, severity }
}

/** Human-readable one-liner for a reroute, e.g. "A → B → C (+$1200, +6d)". */
export function formatReroute(r: Reroute): string {
  if (!r.alternate) return `${r.fromLabel} → ${r.toLabel}: no alternate route available`
  const extra: string[] = []
  if (r.addedCost != null && r.addedCost !== 0) extra.push(`${r.addedCost > 0 ? "+" : ""}$${Math.round(r.addedCost)}`)
  if (r.addedTime != null && r.addedTime !== 0) extra.push(`${r.addedTime > 0 ? "+" : ""}${Math.round(r.addedTime)}d`)
  return `${r.alternate.labels.join(" → ")}${extra.length ? ` (${extra.join(", ")})` : ""}`
}
