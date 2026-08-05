import { NextRequest, NextResponse } from "next/server"
import { loadTwin, findSupplyChainId } from "@/lib/datahub/twin-source"
import { blastRadius } from "@/lib/datahub/impact"
import { buildGroundedRationale } from "@/lib/datahub/rationale"
import { recordDisruption } from "@/lib/datahub/writeback"
import { getDownstream } from "@/lib/datahub/read"
import { mcpGetDownstream } from "@/lib/datahub/mcp"
import { nodeUrn } from "@/lib/datahub/urn"
import { isConfigured } from "@/lib/datahub/client"
import { DEMO_TWIN, DEMO_TWIN_ID, isDemoNodeId } from "@/lib/datahub/demo-twin"
import { rerouteAroundNode, formatReroute } from "@/lib/routing"

// Phase C + D + E — deterministic downstream blast radius of a failed node,
// deterministic reroute around it (weighted Dijkstra), a grounded rationale
// citing DataHub URNs, then (if DataHub is configured and record=true) the
// disruption written back to DataHub as an incident + tags + documentation.
//
// Demo-twin nodes are served without a database so the public /demo page works
// logged-out — including real DataHub write-back when configured.

export async function POST(req: NextRequest) {
  try {
    const { nodeId, record = true } = await req.json()
    if (!nodeId) {
      return NextResponse.json({ error: "nodeId is required." }, { status: 400 })
    }

    const isDemo = isDemoNodeId(nodeId)
    const supplyChainId = isDemo ? DEMO_TWIN_ID : await findSupplyChainId(nodeId)
    if (!supplyChainId) {
      return NextResponse.json({ error: "Node not found in any supply chain." }, { status: 404 })
    }

    const twin = isDemo ? DEMO_TWIN : await loadTwin(supplyChainId)
    if (!twin) {
      return NextResponse.json({ error: "Supply chain not found or empty." }, { status: 404 })
    }

    // The math decides: blast radius + alternate routes, both deterministic.
    const blast = blastRadius(twin, nodeId)
    const reroute = rerouteAroundNode(
      twin.nodes.map((n) => ({ id: n.id, label: n.name ?? n.id })),
      twin.edges,
      nodeId
    )
    const grounded = buildGroundedRationale(twin, blast, reroute)

    // Read-path: when DataHub is the source of truth, pull the downstream lineage
    // back from DataHub and cross-check it against our local computation.
    // Preferred transport is the official DataHub MCP Server (get_lineage tool);
    // direct GMS GraphQL is the fallback.
    let lineageCheck:
      | { source: "datahub-mcp" | "datahub-graphql" | "local"; datahubDownstream: number; agrees: boolean }
      | null = null
    if (isConfigured()) {
      try {
        const urn = nodeUrn(supplyChainId, nodeId)
        const viaMcp = await mcpGetDownstream(urn)
        const dh = viaMcp ?? (await getDownstream(urn))
        const dhIds = new Set(dh.map((h) => h.nodeId).filter(Boolean) as string[])
        const localIds = new Set(blast.impacted.map((n) => n.id))
        const agrees = dhIds.size === localIds.size && [...localIds].every((id) => dhIds.has(id))
        lineageCheck = {
          source: viaMcp ? "datahub-mcp" : "datahub-graphql",
          datahubDownstream: dhIds.size,
          agrees,
        }
      } catch {
        lineageCheck = { source: "local", datahubDownstream: 0, agrees: false }
      }
    }

    let incidentUrn: string | null = null
    if (record && isConfigured()) {
      incidentUrn = await recordDisruption(supplyChainId, blast, grounded.summary)
    }

    return NextResponse.json({
      supplyChainId,
      failedNodeId: blast.failedNodeId,
      totalSeverity: blast.totalSeverity,
      affectedOwners: blast.affectedOwners,
      impacted: blast.impacted,
      rationale: grounded.summary,
      grounded: {
        confidence: grounded.confidence,
        needsReview: grounded.needsReview,
        claims: grounded.claims,
      },
      reroute: {
        severity: reroute.severity,
        feasibleCount: reroute.feasibleCount,
        infeasibleCount: reroute.infeasibleCount,
        top: reroute.reroutes.slice(0, 3).map((r) => ({
          fromLabel: r.fromLabel,
          toLabel: r.toLabel,
          feasible: r.feasible,
          route: formatReroute(r),
          addedCost: r.addedCost,
          addedTime: r.addedTime,
        })),
      },
      dataHub: { configured: isConfigured(), recorded: Boolean(incidentUrn), incidentUrn, lineageCheck },
    })
  } catch (err: any) {
    console.error("[datahub/impact] error:", err?.message)
    return NextResponse.json({ error: "Failed to compute impact." }, { status: 500 })
  }
}
