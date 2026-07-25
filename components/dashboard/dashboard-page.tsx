"use client"

import { RefreshCw } from "lucide-react"
import { NotificationFeed } from "@/components/dashboard/notification-feed"
import { useDashboardMetrics } from "@/components/dashboard/useDashboardMetrics"
import { PageHeader } from "@/components/ui/page-header"
import { Reveal } from "@/components/motion"

export default function DashboardPage() {
  const m = useDashboardMetrics()

  // Calculate exposure pct (e.g. "7%" from metrics or default to "0%")
  const exposurePct = m.isLoading ? "…" : m.nodeExposurePct || "0%"
  const exposureFillWidth = m.isLoading ? "0%" : m.nodeExposurePct || "0%"

  return (
    <div className="relative min-h-full flex-1 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-8">
        {/* Page header */}
        <PageHeader
          eyebrow="Control Tower"
          title="Control Center"
          subtitle="Operational intelligence overview"
          actions={
            <div className="flex items-center gap-2">
              {m.isLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-theme-green">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-green animate-pulse" />
                {m.isLoading ? "LOADING" : "LIVE"}
              </div>
            </div>
          }
        />

        {/* Stats row */}
        <Reveal>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">Node Exposure</div>
              <div className="truncate font-display text-2xl font-semibold text-theme-red">{exposurePct}</div>
              <div className="text-xs text-muted-foreground">{m.isLoading ? "…" : `${m.totalNodes} nodes total`}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-red" />
                <span className="text-[0.62rem] font-semibold text-theme-red">{m.activeFaults} at risk</span>
              </div>
            </div>
            {/* Card 2 */}
            <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">Recovery Window</div>
              <div className="truncate font-display text-2xl font-semibold text-foreground">{m.isLoading ? "…" : m.recoveryWindow}</div>
              <div className="text-xs text-muted-foreground">estimated range</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-amber" />
                <span className="text-[0.62rem] font-semibold text-theme-amber">lead time</span>
              </div>
            </div>
            {/* Card 3 */}
            <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">Fault Signals</div>
              <div className="truncate font-display text-2xl font-semibold text-foreground">{m.isLoading ? "…" : String(m.activeFaults)}</div>
              <div className="text-xs text-muted-foreground">nodes risk &gt; 75</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-blue" />
                <span className="text-[0.62rem] font-semibold text-theme-blue">active faults</span>
              </div>
            </div>
            {/* Card 4 */}
            <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">Supply Chains</div>
              <div className="truncate font-display text-2xl font-semibold text-foreground">{m.isLoading ? "…" : String(m.totalSupplyChains)}</div>
              <div className="text-xs text-muted-foreground">{m.isLoading ? "…" : `${m.totalEdges} connections`}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-green" />
                <span className="text-[0.62rem] font-semibold text-theme-green">all synced</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Alerts panel */}
        <Reveal delay={0.05}>
          <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <NotificationFeed />
          </div>
        </Reveal>
      </div>
    </div>
  )
}
