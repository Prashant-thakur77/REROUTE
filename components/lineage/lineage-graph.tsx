"use client"

import { useMemo } from "react"
import { layoutGraph } from "./layout"

export interface GraphNodeMeta {
  id: string
  name: string
  type: string
}

export interface ImpactMeta {
  hops: number
  severity: number
}

interface Props {
  nodes: GraphNodeMeta[]
  edges: { source: string; target: string }[]
  failedId?: string | null
  /** id → impact info for downstream-impacted nodes. */
  impacted?: Map<string, ImpactMeta>
  onSelect?: (id: string) => void
}

const BOX_W = 140
const BOX_H = 50

// Severity → heat colour (amber to red). Severity is roughly 0–5.
function heat(sev: number): string {
  const t = Math.max(0, Math.min(1, sev / 4))
  // interpolate amber (#F59E0B) → red (#EF4444)
  const r = Math.round(0xf5 + (0xef - 0xf5) * t)
  const g = Math.round(0x9e + (0x44 - 0x9e) * t)
  const b = Math.round(0x0b + (0x44 - 0x0b) * t)
  return `rgb(${r},${g},${b})`
}

export function LineageGraph({ nodes, edges, failedId, impacted, onSelect }: Props) {
  const layout = useMemo(() => layoutGraph(nodes, edges), [nodes, edges])
  const meta = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  return (
    <div className="w-full overflow-auto rounded-xl border border-border bg-card/50 p-2">
      <svg
        width={Math.max(layout.width, 320)}
        height={Math.max(layout.height, 200)}
        role="img"
        aria-label="Supply-chain lineage graph with blast radius"
        className="min-w-full"
      >
        {/* edges */}
        {layout.edges.map((e, i) => {
          const s = layout.nodes.get(e.source)
          const t = layout.nodes.get(e.target)
          if (!s || !t) return null
          const x1 = s.x + BOX_W / 2
          const y1 = s.y
          const x2 = t.x - BOX_W / 2
          const y2 = t.y
          const mx = (x1 + x2) / 2
          const onBlast =
            (impacted?.has(e.target) || e.target === failedId) &&
            (impacted?.has(e.source) || e.source === failedId)
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={onBlast ? "#EF4444" : "currentColor"}
              strokeOpacity={onBlast ? 0.9 : 0.25}
              strokeWidth={onBlast ? 2 : 1.25}
              className="text-muted-foreground"
              markerEnd="url(#arrow)"
            />
          )
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" className="text-muted-foreground" />
          </marker>
        </defs>

        {/* nodes */}
        {Array.from(layout.nodes.values()).map((ln) => {
          const m = meta.get(ln.id)
          const isFailed = ln.id === failedId
          const imp = impacted?.get(ln.id)
          const stroke = isFailed ? "#DC2626" : imp ? heat(imp.severity) : "currentColor"
          const fillOpacity = isFailed ? 0.16 : imp ? 0.12 : 0
          return (
            <g
              key={ln.id}
              transform={`translate(${ln.x - BOX_W / 2}, ${ln.y - BOX_H / 2})`}
              onClick={() => onSelect?.(ln.id)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") onSelect?.(ln.id)
              }}
            >
              <rect
                width={BOX_W}
                height={BOX_H}
                rx={10}
                fill={stroke}
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeOpacity={isFailed || imp ? 0.9 : 0.35}
                strokeWidth={isFailed ? 2 : 1.25}
                className="text-border transition-all"
              />
              <text
                x={BOX_W / 2}
                y={BOX_H / 2 - 4}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
              >
                {truncate(m?.name ?? ln.id, 18)}
              </text>
              <text
                x={BOX_W / 2}
                y={BOX_H / 2 + 12}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] uppercase tracking-wide"
              >
                {isFailed ? "● FAILED" : imp ? `${imp.hops}-hop · sev ${imp.severity}` : m?.type ?? ""}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}
