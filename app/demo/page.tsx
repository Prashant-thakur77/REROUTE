import type { Metadata } from "next"
import Link from "next/link"
import { ShieldAlert, ArrowRight } from "lucide-react"
import { LineageView } from "@/components/lineage/lineage-view"

// Public, zero-login demo of the DataHub integration: the built-in semiconductor
// twin served without a database. Judges can click a node and watch the blast
// radius + deterministic reroute + (when configured) live DataHub write-back.

export const metadata: Metadata = {
  title: "REROUTE — Live Demo · DataHub Lineage & Impact",
  description:
    "Click any supply-chain node to fail it: deterministic blast radius, weighted-Dijkstra reroutes, URN-grounded reasoning, and incidents written back to DataHub.",
}

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Minimal public chrome — no auth, no app sidebar */}
      <header
        role="banner"
        className="sticky top-0 z-[100] flex h-[52px] w-full shrink-0 items-center justify-between border-b border-theme-border-subtle bg-theme-bg-surface px-4 sm:px-6"
      >
        <Link href="/" className="group flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-theme-blue/10 blur-sm transition-all group-hover:blur-md" />
            <div className="relative rounded-xl bg-theme-blue p-1.5 shadow-sm">
              <ShieldAlert className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
          </div>
          <span className="text-[1rem] font-[700] tracking-[-0.02em] text-theme-text-primary">REROUTE</span>
          <span className="ml-1 rounded-full border border-theme-blue/30 bg-theme-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-theme-blue">
            Live demo
          </span>
        </Link>
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Full app <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 flex-col">
        <LineageView demoMode />
      </main>
    </div>
  )
}
