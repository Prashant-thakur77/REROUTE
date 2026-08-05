import { NextRequest, NextResponse } from "next/server"
import { resolveIncident } from "@/lib/datahub/writeback"
import { isConfigured } from "@/lib/datahub/client"

// Close the incident lifecycle: REROUTE raised it on disruption; the operator
// resolves it here once the reroute is actioned, and DataHub reflects it.

export async function POST(req: NextRequest) {
  try {
    if (!isConfigured()) {
      return NextResponse.json({ error: "DataHub is not configured." }, { status: 503 })
    }
    const { incidentUrn, message } = await req.json()
    if (!incidentUrn) {
      return NextResponse.json({ error: "incidentUrn is required." }, { status: 400 })
    }
    await resolveIncident(
      incidentUrn,
      message ?? "Resolved via REROUTE — alternate route actioned."
    )
    return NextResponse.json({ resolved: true, incidentUrn })
  } catch (err: any) {
    console.error("[datahub/resolve] error:", err?.message)
    return NextResponse.json({ error: "Failed to resolve incident." }, { status: 500 })
  }
}
