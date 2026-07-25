"use client"

import Link from "next/link"
import { Reveal, Magnetic } from "@/components/motion"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] px-6 py-20 md:px-12 md:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 120%, rgba(39,72,232,0.10) 0%, transparent 60%)",
        }}
      />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-tight text-[#0F172A]">
          Ready to prevent your next{" "}
          <span className="italic text-[#2748E8]">supply chain crisis?</span>
        </h2>
        <div className="mt-9 flex justify-center">
          <Magnetic>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-10 py-4 text-base font-semibold text-[#F8FAFC] shadow-[0_16px_50px_rgba(24,22,15,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Request Access →
            </Link>
          </Magnetic>
        </div>
        <p className="mt-6 text-[13px] text-[#64748B]">
          No credit card required · Enterprise-ready · Backed by Google ADK
        </p>
      </Reveal>
    </section>
  )
}
