"use client"

import Link from "next/link"
import { Reveal } from "@/components/motion"
import { AnimatedCounter } from "@/components/motion"

const PAINS = [
  "No real-time visibility into live network health",
  "Reactive crisis management, not proactive prevention",
  "Fragmented tools with no unified intelligence layer",
]

const WINS = [
  "Live Digital Twin with real-time node status changes",
  "6 Gemini agents autonomously investigating disruptions",
  "Monte Carlo simulations before disruptions occur",
  "Mem0-powered memory learns from every past event",
]

export function ProblemSolution() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-[#F8FAFC] px-6 py-16 md:px-12 md:py-24"
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
        {/* Problem */}
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B91C1C]">
            The Problem
          </p>
          <div className="mt-4 font-display text-[clamp(3.5rem,8vw,5.5rem)] font-semibold leading-none text-[#0F172A]">
            <AnimatedCounter value={73} suffix="%" />
          </div>
          <p className="mt-3 max-w-md text-lg text-[#475569]">
            of supply chain disruptions are identified after the damage is
            already done.
          </p>
          <ul className="mt-8 space-y-3">
            {PAINS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-[#475569]">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2] text-xs font-bold text-[#B91C1C]">
                  ✗
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Solution */}
        <Reveal direction="left" delay={0.1}>
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-[0_12px_40px_rgba(24,22,15,0.06)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2748E8]">
              REROUTE Changes This
            </p>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-[#0F172A] sm:text-3xl">
              From reactive damage control to proactive prevention
            </h2>
            <ul className="mt-6 space-y-3">
              {WINS.map((w) => (
                <li key={w} className="flex items-start gap-3 text-[15px] text-[#475569]">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EDFAF3] text-xs font-bold text-[#1A7F4B]">
                    ✓
                  </span>
                  {w}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-3 text-sm font-semibold text-[#F8FAFC] transition-transform duration-200 hover:-translate-y-0.5"
            >
              See the Platform →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
