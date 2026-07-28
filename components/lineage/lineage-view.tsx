"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Database, Zap, ShieldAlert, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react"
import { useUser } from "@/lib/stores/user"
import { getSupplyChains } from "@/lib/api/supply-chain"
import { PageHeader } from "@/components/ui/page-header"
import { Reveal } from "@/components/motion"
import { LineageGraph, type ImpactMeta } from "./lineage-graph"

interface TwinNode { id: string; name?: string; type?: string; owner?: string; risk?: number }
interface TwinEdge { source: string; target: string }
interface Twin { supplyChainId: string; nodes: TwinNode[]; edges: TwinEdge[] }

interface GroundedClaim { text: string; urn: string }
interface ImpactResponse {
  failedNodeId: string
  totalSeverity: number
  affectedOwners: string[]
  impacted: { id: string; name: string; type: string; hops: number; severity: number; owner?: string }[]
  rationale: string
  grounded: { confidence: number; needsReview: boolean; claims: GroundedClaim[] }
  dataHub: { configured: boolean; recorded: boolean; incidentUrn: string | null }
}

// Optional: public DataHub UI base for deep-links (e.g. http://localhost:9002).
const DATAHUB_UI = process.env.NEXT_PUBLIC_DATAHUB_URL?.replace(/\/+$/, "")
const datasetLink = (urn: string) =>
  DATAHUB_UI ? `${DATAHUB_UI}/dataset/${encodeURIComponent(urn)}/` : null

export function LineageView() {
  const { userData } = useUser()
  const [chains, setChains] = useState<{ id: string; name: string }[]>([])
  const [chainId, setChainId] = useState<string>("")
  const [twin, setTwin] = useState<Twin | null>(null)
  const [twinLoading, setTwinLoading] = useState(false)
  const [dhConfigured, setDhConfigured] = useState(false)
  const [failedId, setFailedId] = useState<string | null>(null)
  const [impact, setImpact] = useState<ImpactResponse | null>(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [sync, setSync] = useState<{ loading: boolean; msg?: string }>({ loading: false })

  useEffect(() => {
    if (!userData?.id) return
    getSupplyChains(userData.id)
      .then((cs) =>
        setChains(cs.map((c: any) => ({ id: c.supply_chain_id, name: c.name ?? c.supply_chain_id })))
      )
      .catch(() => setChains([]))
  }, [userData?.id])

  useEffect(() => {
    if (!chainId) return
    setTwinLoading(true)
    setTwin(null)
    setImpact(null)
    setFailedId(null)
    fetch(`/api/datahub/twin?supplyChainId=${encodeURIComponent(chainId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.twin) setTwin(d.twin)
        setDhConfigured(Boolean(d.dataHubConfigured))
      })
      .catch(() => setTwin(null))
      .finally(() => setTwinLoading(false))
  }, [chainId])

  const impactedMap = useMemo(() => {
    const m = new Map<string, ImpactMeta>()
    for (const n of impact?.impacted ?? []) m.set(n.id, { hops: n.hops, severity: n.severity })
    return m
  }, [impact])

  async function simulateFailure(nodeId: string) {
    setFailedId(nodeId)
    setImpact(null)
    setImpactLoading(true)
    try {
      const r = await fetch("/api/datahub/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, record: dhConfigured }),
      })
      setImpact(await r.json())
    } catch {
      setImpact(null)
    } finally {
      setImpactLoading(false)
    }
  }

  async function syncToDataHub() {
    if (!chainId) return
    setSync({ loading: true })
    try {
      const r = await fetch("/api/datahub/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplyChainId: chainId }),
      })
      const d = await r.json()
      setSync({ loading: false, msg: d.error ?? `Synced ${d.aspectsEmitted} aspects (${d.nodes} nodes).` })
    } catch {
      setSync({ loading: false, msg: "Sync failed." })
    }
  }

  return (
    <div className="relative min-h-full flex-1 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <PageHeader
          eyebrow="DataHub"
          title="Lineage & Impact"
          subtitle="The supply-chain twin as a DataHub metadata graph. Click any node to fail it — REROUTE computes the deterministic blast radius and writes the incident back to DataHub."
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  dhConfigured
                    ? "border-theme-green/30 bg-theme-green/10 text-theme-green"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dhConfigured ? "bg-theme-green" : "bg-muted-foreground"}`} />
                DataHub {dhConfigured ? "connected" : "not configured"}
              </span>
              <button
                onClick={syncToDataHub}
                disabled={!chainId || sync.loading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sync.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Sync to DataHub
              </button>
            </div>
          }
        />

        {/* Chain selector */}
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Supply chain</label>
            <select
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select a supply chain…</option>
              {chains.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {sync.msg && <span className="text-xs text-muted-foreground">{sync.msg}</span>}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Graph */}
          <Reveal className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Lineage graph</h2>
                {impactLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {twinLoading ? (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading twin…
                </div>
              ) : twin && twin.nodes.length ? (
                <LineageGraph
                  nodes={twin.nodes.map((n) => ({ id: n.id, name: n.name ?? n.id, type: n.type ?? "node" }))}
                  edges={twin.edges}
                  failedId={failedId}
                  impacted={impactedMap}
                  onSelect={simulateFailure}
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                  {chainId ? "This supply chain has no nodes." : "Select a supply chain to view its lineage."}
                </div>
              )}
            </div>
          </Reveal>

          {/* Impact panel */}
          <Reveal delay={0.05}>
            <ImpactPanel impact={impact} loading={impactLoading} failedId={failedId} />
          </Reveal>
        </div>
      </div>
    </div>
  )
}

function ImpactPanel({
  impact,
  loading,
  failedId,
}: {
  impact: ImpactResponse | null
  loading: boolean
  failedId: string | null
}) {
  if (!failedId) {
    return (
      <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        <Zap className="mb-2 h-6 w-6 opacity-50" />
        Click a node in the graph to simulate a disruption.
      </div>
    )
  }

  const g = impact?.grounded
  const pct = g ? Math.round(g.confidence * 100) : null

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-theme-red" />
        <h2 className="font-display text-lg font-semibold">Blast radius</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Computing impact…
        </div>
      ) : impact ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Impacted nodes" value={String(impact.impacted.length)} />
            <Metric label="Blast score" value={String(impact.totalSeverity)} tone="red" />
          </div>

          {/* Grounded confidence */}
          {g && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wide text-muted-foreground">Grounded confidence</span>
                <span className={`font-semibold ${g.needsReview ? "text-theme-amber" : "text-theme-green"}`}>{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full ${g.needsReview ? "bg-theme-amber" : "bg-theme-green"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {g.needsReview && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-theme-amber">
                  <AlertTriangle className="h-3 w-3" /> Weakly grounded — human review advised.
                </p>
              )}
            </div>
          )}

          {/* Grounded claims, each citing a URN */}
          {g?.claims?.length ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reasoning (cited)</h3>
              <ul className="space-y-2">
                {g.claims.map((c, i) => {
                  const link = datasetLink(c.urn)
                  return (
                    <li key={i} className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-xs">
                      <p className="text-foreground">{c.text}</p>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                          {shortUrn(c.urn)} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <code className="mt-1 block truncate text-[10px] text-muted-foreground">{shortUrn(c.urn)}</code>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {/* Owners to notify */}
          {impact.affectedOwners.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owners to notify</h3>
              <div className="flex flex-wrap gap-1.5">
                {impact.affectedOwners.map((o) => (
                  <span key={o} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium">{o}</span>
                ))}
              </div>
            </div>
          )}

          {/* DataHub write-back state */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
            {impact.dataHub.recorded ? (
              <p className="flex items-center gap-1.5 text-theme-green">
                <CheckCircle2 className="h-3.5 w-3.5" /> Incident written back to DataHub
              </p>
            ) : impact.dataHub.configured ? (
              <p className="text-muted-foreground">DataHub connected — write-back skipped for this run.</p>
            ) : (
              <p className="text-muted-foreground">DataHub not configured — impact computed locally. Set <code>DATAHUB_GMS_URL</code> to write incidents back.</p>
            )}
            {impact.dataHub.incidentUrn && (
              <code className="mt-1 block truncate text-[10px] text-muted-foreground">{impact.dataHub.incidentUrn}</code>
            )}
          </div>
        </>
      ) : (
        <p className="py-8 text-sm text-muted-foreground">Failed to compute impact.</p>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-display text-xl font-semibold ${tone === "red" ? "text-theme-red" : "text-foreground"}`}>{value}</div>
    </div>
  )
}

function shortUrn(urn: string): string {
  const m = urn.match(/,([^,]+),[A-Z]+\)$/)
  return m ? m[1] : urn
}
