"use client"

import Link from "next/link"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion"

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2748E8]">
      {children}
    </p>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-[12px] font-medium text-[#475569]">
      {children}
    </span>
  )
}

/* ── 1 · Digital Twin ─────────────────────────────────────────── */
export function FeatureDigitalTwin() {
  type TwinNode = { label: string; name: string; risk?: boolean }
  const nodes1: TwinNode[] = [
    { label: "SUPPLIER", name: "Steel Supplier" },
    { label: "PORT", name: "Port of Shenzhen" },
    { label: "FACTORY", name: "Assembly Plant" },
  ]
  const nodes2: TwinNode[] = [
    { label: "WAREHOUSE", name: "Parts Staging" },
    { label: "DIST.", name: "US West Coast" },
    { label: "RISK · 78%", name: "National Retail", risk: true },
  ]

  return (
    <section id="platform" className="scroll-mt-20 bg-[#F8FAFC] px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <Eyebrow>Digital Twin</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight text-[#0F172A]">
            Build your supply chain as a living network
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#475569]">
            Drag-and-drop nodes onto a real-time canvas. Every connection, port,
            warehouse, and supplier is mapped — and changes state dynamically
            when intelligence arrives.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Tag>43 Nodes</Tag>
            <Tag>39 Connections</Tag>
            <Tag>Real-time Status</Tag>
            <Tag>Leaflet Maps</Tag>
          </div>
        </Reveal>

        <Reveal direction="left" delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-[0_16px_50px_rgba(24,22,15,0.08)] sm:p-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="relative space-y-8">
              {[nodes1, nodes2].map((row, ri) => (
                <div
                  key={ri}
                  className={`flex items-center ${ri === 1 ? "ml-3 sm:ml-6" : ""}`}
                >
                  {row.map((n, ni) => (
                    <div key={n.name} className="flex items-center">
                      <div
                        className={`rounded-xl border bg-[#FFFFFF] px-2.5 py-2 shadow-sm sm:px-3 ${
                          n.risk ? "border-[#B91C1C]" : "border-[#CBD5E1]"
                        }`}
                      >
                        <div
                          className={`text-[9px] font-bold uppercase tracking-wide ${
                            n.risk ? "text-[#B91C1C]" : "text-[#64748B]"
                          }`}
                        >
                          {n.label}
                        </div>
                        <div className="text-[12px] font-semibold text-[#0F172A]">
                          {n.name}
                        </div>
                      </div>
                      {ni < row.length - 1 && (
                        <div className="h-[2px] w-4 bg-gradient-to-r from-[#CBD5E1] to-[#2748E8]/40 sm:w-8" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 2 · Multi-Agent AI ───────────────────────────────────────── */
const AGENTS = [
  { dot: "#2748E8", name: "Orchestrator", role: "Coordination & routing" },
  { dot: "#7C3AED", name: "Intelligence", role: "Tavily search & news" },
  { dot: "#1A7F4B", name: "Forecast", role: "Trend analysis" },
  { dot: "#B45309", name: "Scenario", role: "What-if modeling" },
  { dot: "#B91C1C", name: "Impact", role: "Financial scoring" },
  { dot: "#475569", name: "Strategy", role: "Mitigation plans" },
]

export function FeatureAgents() {
  return (
    <section
      id="agents"
      className="scroll-mt-20 border-y border-[#E2E8F0] bg-[#F1F5F9] px-6 py-16 md:px-12 md:py-24"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <Eyebrow>Multi-Agent AI</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight text-[#0F172A]">
            Six specialized agents. One unified intelligence.
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#475569]">
            Google Gemini-powered agents work in concert — the Orchestrator
            delegates to Intelligence, Forecast, Scenario, Impact, and Strategy
            agents — each specialized, all coordinated.
          </p>
          <Link
            href="/dashboard"
            className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#0F172A] px-6 py-3 text-sm font-semibold text-[#F8FAFC] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Explore the Agents →
          </Link>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-3" stagger={0.06}>
          {AGENTS.map((a) => (
            <RevealItem
              key={a.name}
              className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(24,22,15,0.08)]"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: a.dot }}
              />
              <div className="mt-3 text-[14px] font-semibold text-[#0F172A]">
                {a.name}
              </div>
              <div className="text-[12px] text-[#64748B]">{a.role}</div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ── 3 · Chaos Simulation ─────────────────────────────────────── */
const SIM_ALERTS = [
  {
    title: "Imminent Port Congestion",
    sev: "65% severity",
    sevColor: "#B45309",
    sevBg: "#FEF3C7",
    days: "14 days",
    type: "Disruption",
  },
  {
    title: "Supplier Financial Instability",
    sev: "40% severity",
    sevColor: "#854D0E",
    sevBg: "#FEF9C3",
    days: "30 days",
    type: "Political",
  },
]

export function FeatureSimulation() {
  return (
    <section id="simulation" className="scroll-mt-20 bg-[#F8FAFC] px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <Eyebrow>Chaos Simulation</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight text-[#0F172A]">
            Stress-test before reality does
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#475569]">
            Inject artificial disruptions — port delays, supplier collapses,
            price spikes — and run 1,000 Monte Carlo simulations to see exactly
            how your network responds before it happens.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Tag>1,000 Monte Carlo runs</Tag>
            <Tag>Cascade modeling</Tag>
            <Tag>AI forecast scenarios</Tag>
          </div>
        </Reveal>

        <RevealGroup className="space-y-3" stagger={0.1}>
          {SIM_ALERTS.map((a) => (
            <RevealItem
              key={a.title}
              className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4"
            >
              <div className="flex items-start justify-between">
                <div className="text-[14px] font-semibold text-[#0F172A]">
                  {a.title}
                </div>
                <span className="rounded-full border border-[#B91C1C]/25 bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-bold text-[#B91C1C]">
                  HIGH ALERT
                </span>
              </div>
              <div className="mt-1 text-[12px] text-[#64748B]">
                AI-generated based on risk patterns
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: a.sevBg, color: a.sevColor }}
                >
                  {a.sev}
                </span>
                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                  {a.days}
                </span>
                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                  {a.type}
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
