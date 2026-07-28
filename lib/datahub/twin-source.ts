// Server-only: load a supply-chain twin from Supabase into the DataHub TwinGraph
// shape. Kept separate from the pure DataHub layer so impact/urn/emit stay
// dependency-free and unit testable.

import { supabaseServer } from "@/lib/supabase/server"
import type { TwinGraph, TwinNode, TwinEdge } from "./types"

const num = (x: unknown): number | undefined => {
  if (x == null) return undefined
  const n = Number(x)
  return Number.isFinite(n) ? n : undefined
}

/** Load a twin by supply-chain id. Returns null if it has no nodes. */
export async function loadTwin(supplyChainId: string): Promise<TwinGraph | null> {
  const [{ data: dbNodes }, { data: dbEdges }] = await Promise.all([
    supabaseServer
      .from("nodes")
      .select("node_id, name, type, data")
      .eq("supply_chain_id", supplyChainId),
    supabaseServer
      .from("edges")
      .select("from_node_id, to_node_id, data")
      .eq("supply_chain_id", supplyChainId),
  ])

  if (!dbNodes?.length) return null

  const nodes: TwinNode[] = dbNodes.map((n: any) => ({
    id: n.node_id,
    name: n.name ?? n.node_id,
    type: n.type ?? n.data?.type,
    country: n.data?.location?.country ?? n.data?.country,
    capacity: num(n.data?.capacity),
    leadTime: num(n.data?.leadTime ?? n.data?.lead_time),
    risk: num(n.data?.riskScore ?? n.data?.risk),
    owner: n.data?.owner ?? n.data?.ownerEmail,
  }))

  const edges: TwinEdge[] = (dbEdges ?? []).map((e: any) => ({
    source: e.from_node_id,
    target: e.to_node_id,
    cost: num(e.data?.cost),
    time: num(e.data?.transitTime ?? e.data?.transit_time),
    mode: e.data?.mode,
  }))

  return { supplyChainId, nodes, edges }
}

/** Find which supply chain a node belongs to. */
export async function findSupplyChainId(nodeId: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("nodes")
    .select("supply_chain_id")
    .eq("node_id", nodeId)
    .maybeSingle()
  return data?.supply_chain_id ?? null
}
