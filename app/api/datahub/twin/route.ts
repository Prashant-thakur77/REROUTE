import { NextRequest, NextResponse } from "next/server"
import { loadTwin } from "@/lib/datahub/twin-source"
import { isConfigured } from "@/lib/datahub/client"
import { DEMO_TWIN, DEMO_TWIN_ID } from "@/lib/datahub/demo-twin"

// Return a supply-chain twin in the DataHub graph shape, for the Lineage UI to
// render. Read-only; independent of whether DataHub itself is configured. The
// built-in demo twin is served without a database (public /demo page).

export async function GET(req: NextRequest) {
  try {
    const supplyChainId = req.nextUrl.searchParams.get("supplyChainId")
    if (!supplyChainId) {
      return NextResponse.json({ error: "supplyChainId is required." }, { status: 400 })
    }
    const twin = supplyChainId === DEMO_TWIN_ID ? DEMO_TWIN : await loadTwin(supplyChainId)
    if (!twin) {
      return NextResponse.json({ error: "Supply chain not found or empty." }, { status: 404 })
    }
    return NextResponse.json({ twin, dataHubConfigured: isConfigured() })
  } catch (err: any) {
    console.error("[datahub/twin] error:", err?.message)
    return NextResponse.json({ error: "Failed to load twin." }, { status: 500 })
  }
}
