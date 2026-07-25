"use client"

import type { ReactNode } from "react"
import { RevealGroup, RevealItem } from "@/components/motion"
import { AnimatedCounter } from "@/components/motion"

interface Stat {
  value: ReactNode
  label: string
}

const STATS: Stat[] = [
  { value: <AnimatedCounter value={0.885} decimals={3} />, label: "ROC-AUC Model Accuracy" },
  { value: <>&lt;1ms</>, label: "ML Inference Speed" },
  { value: <AnimatedCounter value={180} suffix="K" />, label: "Orders Trained On" },
  { value: <AnimatedCounter value={6} />, label: "Specialized AI Agents" },
]

export function StatsBand() {
  return (
    <section className="relative overflow-hidden bg-[#0F172A] px-6 py-16 md:px-12 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(75,110,255,0.16) 0%, transparent 60%)",
        }}
      />
      <RevealGroup className="relative mx-auto grid max-w-[1100px] grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-8">
        {STATS.map((s, i) => (
          <RevealItem key={i} className="text-center">
            <div className="font-display text-[clamp(2.4rem,5vw,3.4rem)] font-semibold leading-none text-[#F8FAFC]">
              {s.value}
            </div>
            <div className="mt-3 text-[13px] font-medium uppercase tracking-[0.08em] text-[#94A3B8]">
              {s.label}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
