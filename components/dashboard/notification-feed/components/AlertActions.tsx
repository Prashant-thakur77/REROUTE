"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, CircleDot, CircleCheckBig, UserPlus, Loader2, ListChecks, Sparkles, Route, AlertTriangle } from "lucide-react"
import { useUser } from "@/lib/stores/user"
import {
  getLatestAlertAction,
  recordAlertAction,
  alertStatusLabel,
  DEFAULT_ALERT_STATE,
  type AlertActionState,
  type AlertStatus,
} from "@/lib/alert-actions"

const STATUS_STEPS: { value: Exclude<AlertStatus, "open" | "reopened">; label: string; icon: typeof CircleDot }[] = [
  { value: "acknowledged", label: "Acknowledge", icon: Check },
  { value: "in_progress", label: "In Progress", icon: CircleDot },
  { value: "resolved", label: "Resolve", icon: CircleCheckBig },
]

const TIMEFRAME_STYLE: Record<string, string> = {
  immediate: "border-theme-red/30 bg-theme-red-soft text-theme-red",
  "short-term": "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
  "long-term": "border-theme-blue/30 bg-theme-blue-soft text-theme-blue",
}

const STATUS_BADGE: Record<AlertStatus, string> = {
  open: "border-border bg-muted text-muted-foreground",
  acknowledged: "border-theme-blue/30 bg-theme-blue-soft text-theme-blue",
  in_progress: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
  resolved: "border-theme-green/30 bg-theme-green-soft text-theme-green",
  reopened: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
}

interface MitigationPlan {
  summary: string
  steps: { action: string; timeframe: "immediate" | "short-term" | "long-term"; owner: string }[]
}

interface AlertContext {
  title?: string | null
  message?: string | null
  severity?: string | null
  node?: string | null
  nodeId?: string | null
}

interface RerouteResp {
  failedLabel: string
  severity: string
  feasibleCount: number
  infeasibleCount: number
  reroutes: {
    fromLabel: string
    toLabel: string
    feasible: boolean
    route: string
    addedCost: number | null
    addedTime: number | null
  }[]
}

export function AlertActions({ notificationId, alert }: { notificationId: string; alert?: AlertContext }) {
  const { userData } = useUser()
  const [state, setState] = useState<AlertActionState>(DEFAULT_ALERT_STATE)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [mitigation, setMitigation] = useState<MitigationPlan | null>(null)
  const [generating, setGenerating] = useState(false)
  const [reroute, setReroute] = useState<RerouteResp | null>(null)
  const [rerouting, setRerouting] = useState(false)

  async function doReroute() {
    if (!alert?.nodeId) {
      toast.error("This alert isn't linked to a specific node, so it can't be rerouted.")
      return
    }
    setRerouting(true)
    setReroute(null)
    try {
      const res = await fetch("/api/agent/alert-reroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: alert.nodeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to compute alternate routes")
      setReroute(data as RerouteResp)
    } catch (e: any) {
      toast.error(e?.message || "Could not compute alternate routes.")
    } finally {
      setRerouting(false)
    }
  }

  async function generateMitigation() {
    setGenerating(true)
    setMitigation(null)
    try {
      const res = await fetch("/api/agent/alert-mitigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: alert?.title,
          message: alert?.message,
          severity: alert?.severity,
          node: alert?.node,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to generate mitigation")
      setMitigation(data as MitigationPlan)
    } catch (e: any) {
      toast.error(e?.message || "Could not generate a mitigation plan.")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getLatestAlertAction(notificationId).then((s) => {
      if (cancelled) return
      setState(s)
      setNote(s.note ?? "")
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [notificationId])

  async function apply(
    patch: { status?: Exclude<AlertStatus, "open">; assignee?: string | null; note?: string | null },
    busyKey: string,
  ) {
    if (!userData?.id) {
      toast.error("You need to be signed in to act on alerts.")
      return
    }
    const next: AlertActionState = {
      status: patch.status ?? (state.status === "open" ? "acknowledged" : state.status),
      assignee: patch.assignee !== undefined ? patch.assignee : state.assignee,
      note: patch.note !== undefined ? patch.note : state.note,
      updatedAt: new Date().toISOString(),
    }
    setBusy(busyKey)
    const res = await recordAlertAction({
      notificationId,
      userId: userData.id,
      status: next.status as Exclude<AlertStatus, "open">,
      assignee: next.assignee,
      note: next.note,
    })
    setBusy(null)
    if (!res.ok) {
      toast.error(res.error?.includes("does not exist")
        ? "Run supabase_alert_actions.sql to enable alert actions."
        : `Could not save: ${res.error ?? "unknown error"}`)
      return
    }
    setState(next)
    toast.success("Alert updated")
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" /> Actions
        </h4>
        <span className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${STATUS_BADGE[state.status]}`}>
          {loading ? "…" : alertStatusLabel(state.status)}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-muted p-4 space-y-4">
        {/* Status workflow */}
        <div className="flex flex-wrap gap-2">
          {STATUS_STEPS.map((step) => {
            const active = state.status === step.value
            const Icon = step.icon
            return (
              <button
                key={step.value}
                disabled={busy !== null || loading}
                onClick={() => apply({ status: step.value }, step.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {busy === step.value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                {step.label}
              </button>
            )
          })}
        </div>

        {/* Owner */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium text-foreground">{state.assignee || "Unassigned"}</span>
          {state.assignee !== (userData?.email ?? "") && (
            <button
              disabled={busy !== null || loading}
              onClick={() => apply({ assignee: userData?.email ?? null }, "assign")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              {busy === "assign" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Assign to me
            </button>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Response note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Record the decision or mitigation taken…"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <div className="mt-2 flex justify-end">
            <button
              disabled={busy !== null || loading || note === (state.note ?? "")}
              onClick={() => apply({ note }, "note")}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy === "note" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save note
            </button>
          </div>
        </div>

        {/* Generate mitigation */}
        <div className="border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">AI mitigation plan</span>
            <button
              disabled={generating}
              onClick={generateMitigation}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? "Generating…" : mitigation ? "Regenerate" : "Generate mitigation"}
            </button>
          </div>

          {mitigation && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-foreground">{mitigation.summary}</p>
              <ol className="space-y-2">
                {mitigation.steps.map((s, i) => (
                  <li key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-bold text-primary">{i + 1}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${TIMEFRAME_STYLE[s.timeframe] ?? "border-border bg-muted text-muted-foreground"}`}>
                        {s.timeframe}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.owner}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground">{s.action}</p>
                  </li>
                ))}
              </ol>
              <div className="flex justify-end">
                <button
                  disabled={busy !== null || loading}
                  onClick={() => {
                    setNote(mitigation.summary)
                    apply({ note: mitigation.summary, status: "in_progress" }, "save-mitigation")
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {busy === "save-mitigation" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save plan &amp; mark in progress
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reroute around the affected node (deterministic) */}
        {alert?.nodeId && (
          <div className="border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Reroute around this node</span>
              <button
                disabled={rerouting}
                onClick={doReroute}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                {rerouting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />}
                {rerouting ? "Computing…" : reroute ? "Recompute" : "Find alternate routes"}
              </button>
            </div>

            {reroute && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {reroute.feasibleCount} of {reroute.reroutes.length} affected segment
                  {reroute.reroutes.length === 1 ? "" : "s"} reroutable
                  {reroute.infeasibleCount > 0 ? ` · ${reroute.infeasibleCount} with no alternate` : ""}.
                </p>
                {reroute.reroutes.length === 0 && (
                  <p className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                    No routes pass through this node in the current twin.
                  </p>
                )}
                {reroute.reroutes.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 ${r.feasible ? "border-border bg-card" : "border-theme-red/30 bg-theme-red-soft"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {r.feasible ? (
                        <CircleCheckBig className="h-3.5 w-3.5 shrink-0 text-theme-green" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-theme-red" />
                      )}
                      <span className="text-sm font-medium text-foreground">{r.route}</span>
                    </div>
                    {r.feasible && (r.addedCost != null || r.addedTime != null) && (
                      <div className="mt-1 pl-5 text-xs text-muted-foreground">
                        {r.addedCost != null && `${r.addedCost >= 0 ? "+" : ""}$${Math.round(r.addedCost)} cost`}
                        {r.addedCost != null && r.addedTime != null && " · "}
                        {r.addedTime != null && `${r.addedTime >= 0 ? "+" : ""}${Math.round(r.addedTime)}d transit`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
