// Grounded rationale for a blast radius. Every claim cites the DataHub URN it is
// derived from, and an overall confidence is computed from lineage completeness
// (not from an LLM). Mirrors lib/grounding.ts's philosophy — a 0.6 needs-review
// threshold — but grounds claims in graph facts (URNs) rather than web sources.

import { nodeUrn } from "./urn"
import { formatReroute, type RerouteResult } from "@/lib/routing"
import type { BlastRadius, TwinGraph } from "./types"

// Below this, a human should verify before acting (same bar as lib/grounding.ts).
export const REVIEW_THRESHOLD = 0.6

/** A single statement in the rationale, traceable to a DataHub entity. */
export interface GroundedClaim {
  text: string
  /** DataHub dataset URN this claim is grounded in. */
  urn: string
}

export interface GroundedRationale {
  summary: string
  claims: GroundedClaim[]
  /** 0–1, from lineage completeness. */
  confidence: number
  needsReview: boolean
  ownersToNotify: string[]
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const round = (n: number) => Math.round(n * 100) / 100

/**
 * Build a grounded rationale for a blast radius. Deterministic and pure.
 *
 * confidence = 0.4 base
 *   + 0.2  if the failure has downstream lineage (impact is observable)
 *   + 0.2  if every impacted node has a known type (graph is well-formed)
 *   + 0.2  if at least one impacted node has an owner (the alert is routable)
 *
 * When a deterministic reroute result is provided, the rationale also states the
 * best alternate route (or that none is feasible), grounded in the segment URNs.
 */
export function buildGroundedRationale(
  graph: TwinGraph,
  blast: BlastRadius,
  reroute?: RerouteResult
): GroundedRationale {
  const { supplyChainId } = graph
  const { failedNodeId, impacted, totalSeverity, affectedOwners } = blast

  const failedUrn = nodeUrn(supplyChainId, failedNodeId)
  const failedNode = graph.nodes.find((n) => n.id === failedNodeId)
  const failedName = failedNode?.name ?? failedNodeId

  const hasLineage = impacted.length > 0
  const allTyped = hasLineage && impacted.every((n) => n.type && n.type !== "unknown")
  const routable = affectedOwners.length > 0

  let confidence = 0.4
  if (hasLineage) confidence += 0.2
  if (allTyped) confidence += 0.2
  if (routable) confidence += 0.2
  confidence = round(clamp01(confidence))

  const claims: GroundedClaim[] = []

  claims.push({
    text: hasLineage
      ? `Failure at ${failedName} propagates downstream to ${impacted.length} node(s), blast-radius score ${totalSeverity}.`
      : `${failedName} has no downstream dependents in the lineage graph — impact is contained.`,
    urn: failedUrn,
  })

  // Cite the top few impacted nodes individually, each to its own URN.
  for (const n of impacted.slice(0, 3)) {
    claims.push({
      text: `${n.name} (${n.type}) is impacted at ${n.hops} hop(s), severity ${n.severity}${
        n.owner ? `, owned by ${n.owner}` : ", no owner assigned"
      }.`,
      urn: nodeUrn(supplyChainId, n.id),
    })
  }

  if (routable) {
    claims.push({
      text: `Route this alert to: ${affectedOwners.join(", ")}.`,
      urn: failedUrn,
    })
  }

  // Deterministic reroute outcome (weighted Dijkstra around the failed node).
  let rerouteLine = ""
  if (reroute && reroute.reroutes.length > 0) {
    const best = reroute.reroutes.find((r) => r.feasible)
    if (best) {
      claims.push({
        text: `Alternate route: ${formatReroute(best)}.`,
        urn: nodeUrn(supplyChainId, best.from),
      })
      rerouteLine = `Reroute available (${reroute.feasibleCount}/${reroute.reroutes.length} segments recoverable). `
    } else {
      claims.push({
        text: `No feasible alternate route around ${failedName} — all ${reroute.reroutes.length} broken segment(s) are severed.`,
        urn: failedUrn,
      })
      rerouteLine = `No feasible reroute — escalate. `
    }
  }

  const summary =
    `Disruption at ${failedName} impacts ${impacted.length} downstream node(s) ` +
    `(blast-radius ${totalSeverity}). ` +
    (routable ? `Notify: ${affectedOwners.join(", ")}. ` : `No owners on impacted nodes. `) +
    rerouteLine +
    `Confidence ${Math.round(confidence * 100)}%` +
    (confidence < REVIEW_THRESHOLD ? " — needs human review." : ".")

  return {
    summary,
    claims,
    confidence,
    needsReview: confidence < REVIEW_THRESHOLD,
    ownersToNotify: affectedOwners,
  }
}
