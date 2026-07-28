import { NextRequest, NextResponse } from "next/server"
import { loadTwin } from "@/lib/datahub/twin-source"
import { syncTwin, isConfigured } from "@/lib/datahub/emit"

// Phase A — push a supply-chain twin INTO DataHub as datasets + lineage +
// ownership, so the supply chain becomes a first-class metadata graph.

export async function POST(req: NextRequest) {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: "DataHub is not configured. Set DATAHUB_GMS_URL (and DATAHUB_TOKEN)." },
        { status: 503 }
      )
    }
    const { supplyChainId } = await req.json()
    if (!supplyChainId) {
      return NextResponse.json({ error: "supplyChainId is required." }, { status: 400 })
    }

    const twin = await loadTwin(supplyChainId)
    if (!twin) {
      return NextResponse.json({ error: "Supply chain not found or empty." }, { status: 404 })
    }

    const aspectCount = await syncTwin(twin)
    return NextResponse.json({
      supplyChainId,
      nodes: twin.nodes.length,
      edges: twin.edges.length,
      aspectsEmitted: aspectCount,
    })
  } catch (err: any) {
    console.error("[datahub/sync] error:", err?.message)
    return NextResponse.json({ error: "Failed to sync twin to DataHub." }, { status: 500 })
  }
}
