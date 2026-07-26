"use client"

import React, { useState, useEffect } from "react"
import { Edit, Lock, Mail, Phone, Globe, LogOut, Activity, Network, Zap, Newspaper, MapPin, Users, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/lib/stores/user"
import { ProfilePageSkeleton } from "./profile-page-skeleton"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { UpdateProfileForm } from "./UpdateProfileForm"
import { ChangePasswordDialog } from "./ChangePasswordDialog"
import { logout } from "@/lib/functions/signout"
import { useDashboardMetrics } from "@/components/dashboard/useDashboardMetrics"
import { PageHeader } from "@/components/ui/page-header"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion"
// Default values for notification preferences
const defaultPreferences = {
  email: true,
  sms: false
}


export function ProfilePage(): React.ReactElement {
  const { userData, setUserData, userLoading } = useUser()
  const searchParams = useSearchParams()

  const [notifPrefs, setNotifPrefs] = useState(defaultPreferences)
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isMandatoryUpdate, setIsMandatoryUpdate] = useState(false)

  const m = useDashboardMetrics()
  const exposurePct = m.isLoading ? "…" : m.nodeExposurePct || "0%"
  const exposureFillWidth = m.isLoading ? "0%" : m.nodeExposurePct || "0%"

  // initial fetch
  useEffect(() => {
    setUserData()
  }, [])

  // URL-param popup logic
  useEffect(() => {
    const showPopup = searchParams.get("show_popup")
    if (showPopup === "true") {
      setIsUpdateFormOpen(true)
      setIsMandatoryUpdate(true)
    }
  }, [searchParams])

  if (userLoading || !userData) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-background text-foreground">
      <div className="relative mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          eyebrow="Account"
          title="Profile"
          subtitle="Manage your organization details, security, and notification preferences."
          actions={
            <>
              <Button
                onClick={() => {
                  setIsUpdateFormOpen(true)
                  setIsMandatoryUpdate(false)
                }}
                className="gap-2 rounded-full"
              >
                <Edit className="h-4 w-4" aria-hidden="true" />
                Update Profile
              </Button>
              <Button onClick={logout} variant="outline" className="gap-2 rounded-full">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            </>
          }
        />

        {/* Profile Identity — hero card */}
        <Reveal>
          <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Gradient banner */}
            <div className="relative h-28 bg-gradient-to-br from-primary/25 via-primary/8 to-transparent">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 55% 90% at 15% 0%, hsl(var(--primary) / 0.16), transparent 60%)",
                }}
              />
            </div>

            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
                <div className="relative shrink-0">
                  <Avatar className="h-24 w-24 shadow-md ring-4 ring-card">
                    <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                      {userData.organisation_name
                        ? userData.organisation_name[0].toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-card bg-theme-green"
                    title="Online"
                  />
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <h2 className="truncate font-display text-2xl font-semibold tracking-tight text-foreground">
                    {userData.organisation_name || "Unnamed Organization"}
                  </h2>
                  <p className="truncate text-muted-foreground">{userData.email}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-foreground">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{userData.industry || "No industry"} – {userData.sub_industry || "No sub-industry"}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{userData.location || "Location not specified"}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-foreground">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{userData.employee_count || "N/A"} employees</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Settings row */}
        <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-3" stagger={0.06}>
          {/* Notification Preferences */}
          <RevealItem>
            <Card className="h-full rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-lg text-foreground">
                  <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Email */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                      <Mail className="h-5 w-5 text-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="truncate text-xs text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPrefs.email}
                    onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, email: v }))}
                  />
                </div>

                {/* SMS */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                      <Phone className="h-5 w-5 text-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">SMS</p>
                      <p className="truncate text-xs text-muted-foreground">Receive alerts via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPrefs.sms}
                    onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, sms: v }))}
                  />
                </div>
              </CardContent>
            </Card>
          </RevealItem>

          {/* Security */}
          <RevealItem>
            <Card className="h-full rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-lg text-foreground">
                  <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-muted p-4">
                  <h4 className="mb-1 font-medium text-foreground">Password</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Keep your account secure with a strong password.
                  </p>
                  <Button
                    onClick={() => setIsPasswordDialogOpen(true)}
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </RevealItem>

          {/* Quick Access */}
          <RevealItem>
            <Card className="h-full rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg text-foreground">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { href: "/digital-twin", label: "Digital Twin", desc: "Model your network", icon: Network },
                  { href: "/simulation", label: "Simulations", desc: "Stress-test scenarios", icon: Zap },
                  { href: "/news-room", label: "News Room", desc: "Live intelligence", icon: Newspaper },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-muted p-3 transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                      <link.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{link.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                ))}
              </CardContent>
            </Card>
          </RevealItem>
        </RevealGroup>

        {/* Analytics section */}
        <Reveal delay={0.05} className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Network Overview</p>
          <h3 className="font-display text-xl font-semibold text-foreground">Operational snapshot</h3>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-6" stagger={0.06}>
          {/* System Status */}
          <RevealItem>
            <Card className="rounded-xl border border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-lg text-foreground">
                  <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Exposure Index", value: m.isLoading ? "…" : m.exposureIndex, meta: "avg risk score" },
                    { label: "Mean Recovery", value: m.isLoading ? "…" : m.meanRecovery, meta: "lead time estimate" },
                    { label: "Active Faults", value: m.isLoading ? "…" : String(m.activeFaults), meta: "risk score > 75", danger: true },
                    { label: "Supply Chains", value: m.isLoading ? "…" : String(m.totalSupplyChains), meta: m.isLoading ? "…" : `${m.totalNodes} nodes monitored` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border bg-muted p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                      <div className={`mt-1 font-display text-3xl font-semibold ${s.danger ? "text-theme-red" : "text-foreground"}`}>{s.value}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.meta}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-muted p-4">
                  <div className="mb-2 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Exposure</span>
                    <span className="text-sm font-bold text-theme-red">{exposurePct}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-theme-red transition-all duration-500" style={{ width: exposureFillWidth }}></div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {m.isLoading ? "…" : `${m.totalNodes} total nodes · ${m.activeFaults} exposed`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </RevealItem>

          {/* Node Health */}
          <RevealItem>
            <Card className="rounded-xl border border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-lg text-foreground">
                  <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                  Node Health Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { dot: "bg-theme-blue", value: m.isLoading ? "…" : m.nodeHealth.originNodes, label: "Origin / Suppliers" },
                    { dot: "bg-theme-amber", value: m.isLoading ? "…" : m.nodeHealth.transitHubs, label: "Transit Hubs" },
                    { dot: "bg-primary", value: m.isLoading ? "…" : m.nodeHealth.distribution, label: "Distribution" },
                    { dot: "bg-theme-green", value: m.isLoading ? "…" : m.nodeHealth.endPoints, label: "End Points" },
                  ].map((n) => (
                    <div key={n.label} className="flex flex-col items-center rounded-xl border border-border bg-muted p-4">
                      <div className={`mb-3 h-3 w-3 rounded-full ${n.dot}`}></div>
                      <div className="mb-1 font-display text-2xl font-semibold text-foreground">{n.value}</div>
                      <div className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">{n.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </RevealItem>
        </RevealGroup>

        {/* Profile Update Form Modal */}
        <UpdateProfileForm
          isOpen={isUpdateFormOpen}
          onClose={() => {
            setIsUpdateFormOpen(false)
            setIsMandatoryUpdate(false)
          }}
          currentProfile={userData}
          mandatory={isMandatoryUpdate}
        />

        {/* Password Change Dialog */}
        <ChangePasswordDialog
          isOpen={isPasswordDialogOpen}
          onClose={() => setIsPasswordDialogOpen(false)}
        />
      </div>
    </div>
  )
}
