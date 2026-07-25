"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, CircleDot, CircleCheckBig, UserPlus, Loader2, ListChecks } from "lucide-react"
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

const STATUS_BADGE: Record<AlertStatus, string> = {
  open: "border-border bg-muted text-muted-foreground",
  acknowledged: "border-theme-blue/30 bg-theme-blue-soft text-theme-blue",
  in_progress: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
  resolved: "border-theme-green/30 bg-theme-green-soft text-theme-green",
  reopened: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
}

export function AlertActions({ notificationId }: { notificationId: string }) {
  const { userData } = useUser()
  const [state, setState] = useState<AlertActionState>(DEFAULT_ALERT_STATE)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

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
      </div>
    </div>
  )
}
