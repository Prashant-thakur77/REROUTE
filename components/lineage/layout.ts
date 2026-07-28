// Pure layered DAG layout for the lineage graph. Assigns each node an x-layer
// (longest path from a root) and a y-slot within the layer, so material flow
// reads left → right. Robust to cycles via an iteration cap.

export interface LayoutNode {
  id: string
  layer: number
  slot: number
  x: number
  y: number
}

export interface LayoutEdge {
  source: string
  target: string
}

export interface GraphLayout {
  nodes: Map<string, LayoutNode>
  edges: LayoutEdge[]
  width: number
  height: number
  layers: number
}

const COL_W = 180
const ROW_H = 96
const PAD_X = 90
const PAD_Y = 60

export function layoutGraph(
  rawNodes: { id: string }[],
  rawEdges: { source: string; target: string }[]
): GraphLayout {
  const ids = rawNodes.map((n) => n.id)
  const idSet = new Set(ids)
  const edges = rawEdges.filter((e) => idSet.has(e.source) && idSet.has(e.target))

  const indeg = new Map<string, number>()
  const succ = new Map<string, string[]>()
  for (const id of ids) {
    indeg.set(id, 0)
    succ.set(id, [])
  }
  for (const e of edges) {
    succ.get(e.source)!.push(e.target)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }

  // Longest-path layering via Kahn's algorithm; cap iterations for safety.
  const layer = new Map<string, number>()
  for (const id of ids) layer.set(id, 0)
  const queue = ids.filter((id) => (indeg.get(id) ?? 0) === 0)
  const localIndeg = new Map(indeg)
  let guard = ids.length * ids.length + ids.length
  const q = [...queue]
  while (q.length && guard-- > 0) {
    const u = q.shift()!
    for (const v of succ.get(u) ?? []) {
      layer.set(v, Math.max(layer.get(v) ?? 0, (layer.get(u) ?? 0) + 1))
      localIndeg.set(v, (localIndeg.get(v) ?? 0) - 1)
      if ((localIndeg.get(v) ?? 0) <= 0) q.push(v)
    }
  }

  // Group by layer and assign vertical slots.
  const byLayer = new Map<number, string[]>()
  let maxLayer = 0
  for (const id of ids) {
    const l = layer.get(id) ?? 0
    maxLayer = Math.max(maxLayer, l)
    if (!byLayer.has(l)) byLayer.set(l, [])
    byLayer.get(l)!.push(id)
  }

  const nodes = new Map<string, LayoutNode>()
  let maxSlots = 1
  for (const [l, group] of byLayer) {
    maxSlots = Math.max(maxSlots, group.length)
    group.forEach((id, slot) => {
      nodes.set(id, {
        id,
        layer: l,
        slot,
        x: PAD_X + l * COL_W,
        y: PAD_Y + slot * ROW_H,
      })
    })
  }

  return {
    nodes,
    edges,
    width: PAD_X * 2 + maxLayer * COL_W,
    height: PAD_Y * 2 + Math.max(0, maxSlots - 1) * ROW_H,
    layers: maxLayer + 1,
  }
}
