import { NextRequest, NextResponse } from "next/server"
import { loadTwin, findSupplyChainId } from "@/lib/datahub/twin-source"
import { blastRadius } from "@/lib/datahub/impact"
import { buildGroundedRationale } from "@/lib/datahub/rationale"
import { recordDisruption } from "@/lib/datahub/writeback"
import { getDownstream } from "@/lib/datahub/read"
import { nodeUrn } from "@/lib/datahub/urn"
import { isConfigured } from "@/lib/datahub/client"

// Phase C + E — compute the deterministic downstream blast radius of a failed
// node, then (if DataHub is configured and record=true) write the disruption
// back to DataHub as an incident + tags + documentation.

export async function POST(req: NextRequest) {
  try {
    const { nodeId, record = true } = await req.json()
    if (!nodeId) {
      return NextResponse.json({ error: "nodeId is required." }, { status: 400 })
    }

    const supplyChainId = await findSupplyChainId(nodeId)
    if (!supplyChainId) {
      return NextResponse.json({ error: "Node not found in any supply chain." }, { status: 404 })
    }

    const twin = await loadTwin(supplyChainId)
    if (!twin) {
      return NextResponse.json({ error: "Supply chain not found or empty." }, { status: 404 })
    }

    const blast = blastRadius(twin, nodeId)
    const grounded = buildGroundedRationale(twin, blast)

    // Read-path: when DataHub is the source of truth, pull the downstream lineage
    // back from DataHub and cross-check it against our local computation.
    let lineageCheck: { source: "datahub" | "local"; datahubDownstream: number; agrees: boolean } | null = null
    if (isConfigured()) {
      try {
        const dh = await getDownstream(nodeUrn(supplyChainId, nodeId))
        const dhIds = new Set(dh.map((h) => h.nodeId).filter(Boolean) as string[])
        const localIds = new Set(blast.impacted.map((n) => n.id))
        const agrees = dhIds.size === localIds.size && [...localIds].every((id) => dhIds.has(id))
        lineageCheck = { source: "datahub", datahubDownstream: dhIds.size, agrees }
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
      dataHub: { configured: isConfigured(), recorded: Boolean(incidentUrn), incidentUrn, lineageCheck },
    })
  } catch (err: any) {
    console.error("[datahub/impact] error:", err?.message)
    return NextResponse.json({ error: "Failed to compute impact." }, { status: 500 })
  }
}
