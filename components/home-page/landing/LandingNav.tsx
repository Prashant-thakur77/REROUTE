"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const LINKS = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Platform", href: "#platform" },
  { label: "Agents", href: "#agents" },
  { label: "Simulation", href: "#simulation" },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-[#F8FAFC]/85 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 md:px-12">
        <Link
          href="#top"
          className="font-display text-lg font-semibold tracking-tight text-[#0F172A]"
        >
          REROUTE
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-[#475569] transition-colors hover:text-[#2748E8]"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded-full bg-[#0F172A] px-5 py-2 text-[13px] font-semibold text-[#F8FAFC] transition-transform duration-200 hover:-translate-y-0.5 sm:inline-flex"
          >
            Request Access
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#CBD5E1] text-[#0F172A] md:hidden"
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center text-sm font-medium text-[#475569]"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#0F172A] px-5 py-3 text-[13px] font-semibold text-[#F8FAFC]"
            >
              Request Access
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
