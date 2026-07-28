// Deterministic blast-radius over the supply-chain lineage DAG. When a node
// fails, we walk DOWNSTREAM edges (source → target = material flows into) to find
// every node that depends on it, weighted by business impact and hop distance.
//
// This is the "math decides" half of REROUTE: no LLM guesses the impact — a
// breadth-first traversal computes it exactly, so it is fast, provable, and unit
// testable. The LLM only narrates the result (see lib/grounding.ts).

import type { TwinGraph, TwinNode, ImpactedNode, BlastRadius } from "./types"

// Business-impact weight by node type. Customer-facing nodes downstream of a
// failure hurt the most; upstream-ish nodes least. Unknown types default to 1.
const TYPE_WEIGHT: Record<string, number> = {
  retailer: 5,
  distribution: 4,
  warehouse: 3,
  manufacturer: 3,
  factory: 3,
  port: 2,
  supplier: 1,
}

// Per-hop decay: an impact two hops away matters less than one hop away.
const GAMMA = 0.6

function typeWeight(type?: string): number {
  if (!type) return 1
  return TYPE_WEIGHT[type.toLowerCase()] ?? 1
}

/**
 * Compute the downstream blast radius of a failed node.
 *
 * severity(node) = typeWeight(node) · GAMMA^hops   (hops ≥ 1)
 *
 * Deterministic: same graph + same failed node → identical result, always.
 */
export function blastRadius(graph: TwinGraph, failedNodeId: string): BlastRadius {
  const nodeById = new Map<string, TwinNode>()
  for (const n of graph.nodes) nodeById.set(n.id, n)

  // Downstream adjacency: source → [targets].
  const downstream = new Map<string, string[]>()
  for (const e of graph.edges) {
    if (!e.source || !e.target) continue
    if (!downstream.has(e.source)) downstream.set(e.source, [])
    downstream.get(e.source)!.push(e.target)
  }

  // BFS recording the minimum hop distance to each reachable downstream node.
  const hopsById = new Map<string, number>()
  let frontier = [failedNodeId]
  let hops = 0
  const seen = new Set<string>([failedNodeId])
  while (frontier.length) {
    hops++
    const next: string[] = []
    for (const id of frontier) {
      for (const to of downstream.get(id) ?? []) {
        if (seen.has(to)) continue
        seen.add(to)
        hopsById.set(to, hops)
        next.push(to)
      }
    }
    frontier = next
  }

  const impacted: ImpactedNode[] = []
  for (const [id, h] of hopsById) {
    const node = nodeById.get(id)
    const severity = round(typeWeight(node?.type) * Math.pow(GAMMA, h))
    impacted.push({
      id,
      name: node?.name ?? id,
      type: node?.type ?? "unknown",
      hops: h,
      severity,
      owner: node?.owner,
    })
  }
  // Most-severe first; ties broken by fewer hops then id for stable ordering.
  impacted.sort((a, b) => b.severity - a.severity || a.hops - b.hops || a.id.localeCompare(b.id))

  const totalSeverity = round(impacted.reduce((s, n) => s + n.severity, 0))
  const affectedOwners = Array.from(
    new Set(impacted.map((n) => n.owner).filter((o): o is string => Boolean(o)))
  ).sort()

  return { failedNodeId, impacted, totalSeverity, affectedOwners }
}

function round(x: number): number {
  return Math.round(x * 1000) / 1000
}
