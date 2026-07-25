"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  LineChart,
  Network,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/layout/notification-dropdown"

export function AppSidebar() {
  const pathname = usePathname()

  const navigationItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", isActive: pathname === "/dashboard" },
    { href: "/digital-twin", icon: Network, label: "Digital Twin", isActive: pathname === "/digital-twin" },
    { href: "/simulation", icon: LineChart, label: "Simulation", isActive: pathname === "/simulation" },
  ]

  const footerItems = [
    { href: "/profile", icon: User, label: "Profile", isActive: pathname === "/profile" },
  ]

  return (
    <div className="w-full h-[52px] border-b border-theme-border-subtle bg-theme-bg-glass backdrop-blur-[16px] saturate-[180%] flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 shrink-0 sticky top-0 z-[100] min-w-0">
      {/* Left: Logo + Nav links */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-theme-blue/10 rounded-xl blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-theme-blue p-1.5 rounded-xl shadow-sm">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
          </div>
          <span className="font-[700] text-[1rem] tracking-[-0.02em] text-theme-text-primary hidden sm:block">
            REROUTE
          </span>
        </Link>

        <div className="h-5 w-px bg-theme-border-subtle hidden sm:block shrink-0" />

        <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <TooltipProvider key={item.href} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] md:min-h-0 py-1.5 rounded-[6px] text-[0.82rem] font-[500] transition-all duration-200 border border-transparent shrink-0",
                        item.isActive
                          ? "bg-theme-blue-soft text-theme-blue font-semibold"
                          : "text-theme-text-muted hover:bg-theme-bg-secondary hover:text-theme-text-primary"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden md:block">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </nav>
      </div>

      {/* Right: Notification + Theme + Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <NotificationDropdown />
        <ThemeToggle />
        {footerItems.map((item) => {
          const Icon = item.icon
          return (
            <TooltipProvider key={item.href} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full cursor-pointer bg-theme-bg-secondary border border-theme-border-subtle hover:bg-theme-bg-secondary/80 text-theme-text-primary transition-all duration-200 shrink-0",
                      item.isActive && "ring-2 ring-theme-blue/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}