import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

// Server-driven, idempotent threat-scan scheduler. Instead of relying on each
// browser tab's setInterval (which doesn't survive closed tabs, restarts, or
// scale), an external scheduler (Cloud Scheduler / Vercel Cron / QStash) hits
// this endpoint on an interval. It fans out to the per-chain scan agent, which
// dedups its own work — so running it repeatedly is safe (idempotent).
//
// Wire it up (examples in docs/DEPLOYMENT.md):
//   Cloud Scheduler → GET https://<url>/api/cron/scan  (header: Authorization: Bearer $CRON_SECRET)

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Auth: require the shared cron secret (skips the check only if unset, for local dev).
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization") ?? new URL(req.url).searchParams.get("key") ?? ""
    if (auth !== `Bearer ${secret}` && auth !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const { data: chains, error } = await supabaseServer
      .from("supply_chains")
      .select("supply_chain_id, user_id")
      .not("user_id", "is", null)
      .limit(200)

    if (error) throw error

    const origin = new URL(req.url).origin
    const results: { supplyChainId: string; alertsGenerated: number }[] = []

    // Sequential fan-out keeps LLM/quota pressure bounded; the per-chain agent
    // dedups via DB-timestamp cooldowns so repeat runs don't double-alert.
    for (const c of chains ?? []) {
      if (!c.user_id) continue
      try {
        const res = await fetch(
          `${origin}/api/agent/automated-alerts?supplyChainId=${c.supply_chain_id}&userId=${c.user_id}`,
          { headers: { "x-cron": "1" } },
        )
        const d = await res.json().catch(() => ({}))
        results.push({ supplyChainId: c.supply_chain_id, alertsGenerated: d.alertsGenerated ?? 0 })
      } catch {
        // one chain failing must not abort the whole sweep
      }
    }

    const totalAlerts = results.reduce((n, r) => n + (r.alertsGenerated || 0), 0)
    return NextResponse.json({ scanned: results.length, totalAlerts, results })
  } catch (err: any) {
    console.error("[cron/scan] error:", err?.message)
    return NextResponse.json({ error: "Scan sweep failed" }, { status: 500 })
  }
}
