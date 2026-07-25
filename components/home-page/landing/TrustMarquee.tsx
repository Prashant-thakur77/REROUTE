"use client"

import { Marquee } from "@/components/motion"

const COMPANIES = [
  "Maersk",
  "DHL",
  "Flexport",
  "Kuehne+Nagel",
  "DB Schenker",
  "DSV",
  "Rhenus",
]

export function TrustMarquee() {
  return (
    <section className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-8 md:py-10">
      <p className="mb-5 px-6 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B] md:mb-6">
        Trusted by enterprise logistics teams worldwide
      </p>
      <Marquee speed={30}>
        {COMPANIES.map((name) => (
          <span
            key={name}
            className="px-1 font-display text-xl font-medium text-[#475569]/70 md:text-2xl"
          >
            {name}
          </span>
        ))}
      </Marquee>
    </section>
  )
}
