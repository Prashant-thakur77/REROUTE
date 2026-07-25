"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/motion"
import { Magnetic } from "@/components/motion"

const FLAGS = ["US", "UK", "DE", "SG", "JP"]

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-[#F8FAFC] px-6 pt-12 pb-16 sm:pt-16 sm:pb-20 md:px-12 md:pt-24 md:pb-28"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px]"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% -8%, rgba(39,72,232,0.09) 0%, transparent 62%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left column */}
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#475569]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[#2748E8]/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2748E8]" />
              </span>
              Powered by Multi-Agent AI
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-6 font-display text-[clamp(2.15rem,6vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-[#0F172A]">
              Know{" "}
              <span className="italic text-[#2748E8]">every risk</span>
              <br />
              before it becomes
              <br />a crisis
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-5 font-display text-[1.15rem] italic leading-snug text-[#0F172A] sm:text-[1.35rem]">
              <span className="font-semibold not-italic">REROUTE</span> —
              Risk&nbsp;Evaluation &amp; Route&nbsp;Optimization Using
              Twin&nbsp;Emulation
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-[#475569]">
              We simulate your supply chain as a living digital twin and deploy
              autonomous AI agents to surface risks before they cascade into
              disruptions.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-7 py-3.5 text-sm font-semibold text-[#F8FAFC] shadow-[0_12px_40px_rgba(24,22,15,0.14)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Magnetic>
              <a
                href="#platform"
                className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#FFFFFF] px-7 py-3.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#2748E8] hover:text-[#2748E8]"
              >
                See it in action →
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2">
                {FLAGS.map((f) => (
                  <span
                    key={f}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#F8FAFC] bg-[#F1F5F9] text-[10px] font-bold text-[#475569]"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <span className="text-[13px] text-[#64748B]">
                Trusted by logistics teams across 40+ countries
              </span>
            </div>
          </Reveal>
        </div>

        {/* Right column — live preview */}
        <Reveal direction="left" delay={0.14} className="relative">
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  )
}

function HeroPreview() {
  return (
    <div className="relative">
      {/* Floating alert — top */}
      <motion.div
        className="absolute left-1 -top-3 z-20 flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5 shadow-[0_12px_40px_rgba(24,22,15,0.12)] sm:-left-4 sm:-top-5 sm:px-3 sm:py-2"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-2 w-2 rounded-full bg-[#B91C1C]" />
        <span className="text-[11px] font-semibold text-[#0F172A] sm:text-[12px]">
          Risk Detected · Port Mumbai
        </span>
      </motion.div>

      {/* Floating agents — bottom */}
      <motion.div
        className="absolute -bottom-3 right-1 z-20 flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5 shadow-[0_12px_40px_rgba(24,22,15,0.12)] sm:-bottom-5 sm:-right-3 sm:px-3 sm:py-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <span className="h-2 w-2 rounded-full bg-[#1A7F4B]" />
        <span className="text-[11px] font-semibold text-[#0F172A] sm:text-[12px]">
          6 Agents Active
        </span>
      </motion.div>

      {/* Preview card */}
      <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] shadow-[0_24px_70px_rgba(24,22,15,0.16)]">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F1F5F9] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E86A5E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8B84B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5FBE7E]" />
          <span className="ml-2 text-[11px] font-medium text-[#64748B]">
            REROUTE — Control Center
          </span>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="font-display text-base font-semibold text-[#0F172A]">
                Control Center
              </div>
              <div className="text-[12px] text-[#64748B]">
                Operational intelligence overview
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1A7F4B]/25 bg-[#EDFAF3] px-2.5 py-1 text-[10px] font-bold text-[#1A7F4B]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1A7F4B]" />
              LIVE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Node Exposure", val: "7%", meta: "43 nodes total", red: true },
              { label: "Recovery Window", val: "10–15d", meta: "estimated range" },
              { label: "Fault Signals", val: "2", meta: "risk > 75" },
              { label: "Supply Chains", val: "6", meta: "39 connections" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
              >
                <div className="text-[11px] font-medium text-[#64748B]">
                  {s.label}
                </div>
                <div
                  className={`mt-1 font-display text-xl font-semibold ${
                    s.red ? "text-[#B91C1C]" : "text-[#0F172A]"
                  }`}
                >
                  {s.val}
                </div>
                <div className="text-[10px] text-[#64748B]">{s.meta}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {[
              {
                accent: "#B91C1C",
                title: "Port congestion detected · Shenzhen",
                meta: "about 2 hours ago · 1 source · 1 entity",
              },
              {
                accent: "#B45309",
                title: "Supplier financial instability · Tier-2 region",
                meta: "about 6 hours ago · 1 source · 1 entity",
              },
            ].map((n) => (
              <div
                key={n.title}
                className="relative rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 pl-4"
              >
                <span
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                  style={{ background: n.accent }}
                />
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A]">
                  {n.title}
                  <span className="rounded-full bg-[#EEF2FF] px-1.5 py-0.5 text-[9px] font-bold text-[#2748E8]">
                    LIVE NEWS
                  </span>
                </div>
                <div className="text-[10px] text-[#64748B]">{n.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
