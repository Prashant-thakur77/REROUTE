"use client"

import { useEffect } from "react"
import { Footer } from "@/components/home-page"
import {
  LandingNav,
  HeroSection,
  TrustMarquee,
  ProblemSolution,
  StatsBand,
  FeatureDigitalTwin,
  FeatureAgents,
  FeatureSimulation,
  CtaSection,
} from "@/components/home-page/landing"

export default function Home() {
  // Scope smooth in-page scrolling to the landing page only.
  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.scrollBehavior
    el.style.scrollBehavior = "smooth"
    return () => {
      el.style.scrollBehavior = prev
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-[#0F172A]">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <TrustMarquee />
        <ProblemSolution />
        <StatsBand />
        <FeatureDigitalTwin />
        <FeatureAgents />
        <FeatureSimulation />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
