import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { rerouteAroundNode, formatReroute, type RawNode, type RawEdge } from "@/lib/routing"

// Deterministic rerouting for a threat alert. Given the affected node, load its
// supply-chain graph from the DB and compute real alternate routes around it
// (weighted shortest paths) — no LLM guessing the graph.

export async function POST(req: NextRequest) {
  try {
    const { nodeId } = await req.json()
    if (!nodeId) {
      return NextResponse.json({ error: "nodeId is required." }, { status: 400 })
    }

    // Which supply chain does this node belong to?
    const { data: node } = await supabaseServer
      .from("nodes")
      .select("supply_chain_id, name")
      .eq("node_id", nodeId)
      .maybeSingle()

    if (!node?.supply_chain_id) {
      return NextResponse.json({ error: "Affected node not found in any supply chain." }, { status: 404 })
    }
    const scId = node.supply_chain_id

    const [{ data: dbNodes }, { data: dbEdges }] = await Promise.all([
      supabaseServer.from("nodes").select("node_id, name").eq("supply_chain_id", scId),
      supabaseServer.from("edges").select("from_node_id, to_node_id, data").eq("supply_chain_id", scId),
    ])

    const nodes: RawNode[] = (dbNodes ?? []).map((n: any) => ({ id: n.node_id, label: n.name ?? n.node_id }))
    const edges: RawEdge[] = (dbEdges ?? []).map((e: any) => ({
      source: e.from_node_id,
      target: e.to_node_id,
      cost: e.data?.cost,
      time: e.data?.transitTime ?? e.data?.transit_time,
    }))

    const result = rerouteAroundNode(nodes, edges, nodeId)

    return NextResponse.json({
      failedLabel: result.failedLabel,
      severity: result.severity,
      feasibleCount: result.feasibleCount,
      infeasibleCount: result.infeasibleCount,
      reroutes: result.reroutes.slice(0, 6).map((r) => ({
        fromLabel: r.fromLabel,
        toLabel: r.toLabel,
        feasible: r.feasible,
        route: formatReroute(r),
        addedCost: r.addedCost,
        addedTime: r.addedTime,
      })),
    })
  } catch (err: any) {
    console.error("[alert-reroute] error:", err?.message)
    return NextResponse.json({ error: "Failed to compute alternate routes." }, { status: 500 })
  }
}
