"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/layout/app-header"

export function SimulationHeader() {
  return (
    <AppHeader
      title="Simulation & Scenario Generation"
      leftContent={<SidebarTrigger />}
      className="z-10 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur border-b border-border"
    />
  )
}
