// Phase A — push a REROUTE twin INTO DataHub so the supply chain becomes a
// first-class metadata graph: one Dataset per node, Ownership per owner, custom
// properties for risk/lead-time/capacity, and UpstreamLineage for the edges.
//
// buildTwinAspects() is pure (no network) and unit tested; syncTwin() posts them.

import { upsertAspects, isConfigured, type AspectUpsert } from "./client"
import { nodeUrn, corpUserUrn, PLATFORM, TAGS } from "./urn"
import type { TwinGraph, TwinNode } from "./types"

export { isConfigured }

/**
 * Register REROUTE's custom data platform so supply-chain datasets render with a
 * proper platform name/icon in DataHub instead of an unknown one.
 */
export function buildPlatformAspect(): AspectUpsert {
  return {
    entityType: "dataPlatform",
    entityUrn: `urn:li:dataPlatform:${PLATFORM}`,
    aspect: {
      __type: "DataPlatformInfo",
      name: PLATFORM,
      displayName: "REROUTE Supply Chain",
      type: "OTHERS",
      datasetNameDelimiter: ".",
    },
  }
}

/**
 * REROUTE's tag entities. Tags must exist in DataHub before `addTags` can
 * attach them to a dataset (attaching an unknown tag URN is rejected), so the
 * sync creates them up front.
 */
export function buildTagAspects(): AspectUpsert[] {
  const describe: Record<string, string> = {
    [TAGS.atRisk]: "Node with an active REROUTE disruption",
    [TAGS.impacted]: "Node inside the blast radius of a REROUTE disruption",
    [TAGS.rerouted]: "Node on an active REROUTE alternate route",
  }
  return Object.entries(describe).map(([urn, description]) => ({
    entityType: "tag",
    entityUrn: urn,
    aspect: {
      __type: "TagProperties",
      name: urn.replace(/^urn:li:tag:/, ""),
      description,
    },
  }))
}

/**
 * Build the full aspect list for a twin — DatasetProperties + Ownership +
 * UpstreamLineage per node. Deterministic and side-effect free.
 */
export function buildTwinAspects(graph: TwinGraph): AspectUpsert[] {
  const { supplyChainId, nodes, edges } = graph

  // Register the custom platform + REROUTE's tags first so datasets can attach
  // to them.
  const out0: AspectUpsert[] = [buildPlatformAspect(), ...buildTagAspects()]

  // incoming edges per target node → upstream datasets (source feeds target).
  const upstreamsByTarget = new Map<string, string[]>()
  for (const e of edges) {
    if (!e.source || !e.target) continue
    if (!upstreamsByTarget.has(e.target)) upstreamsByTarget.set(e.target, [])
    upstreamsByTarget.get(e.target)!.push(nodeUrn(supplyChainId, e.source))
  }

  const out: AspectUpsert[] = out0
  for (const n of nodes) {
    const urn = nodeUrn(supplyChainId, n.id)

    out.push({
      entityType: "dataset",
      entityUrn: urn,
      aspect: {
        __type: "DatasetProperties",
        name: n.name ?? n.id,
        description: describeNode(n),
        customProperties: customProps(n),
      },
    })

    if (n.owner) {
      out.push({
        entityType: "dataset",
        entityUrn: urn,
        aspect: {
          __type: "Ownership",
          owners: [{ owner: corpUserUrn(n.owner), type: "TECHNICAL_OWNER" }],
        },
      })
    }

    const upstreams = upstreamsByTarget.get(n.id)
    if (upstreams?.length) {
      out.push({
        entityType: "dataset",
        entityUrn: urn,
        aspect: {
          __type: "UpstreamLineage",
          upstreams: upstreams.map((ds) => ({ dataset: ds, type: "TRANSFORMED" })),
        },
      })
    }
  }
  return out
}

function customProps(n: TwinNode): Record<string, string> {
  const p: Record<string, string> = {}
  if (n.type) p.type = n.type
  if (n.country) p.country = n.country
  if (n.capacity != null) p.capacity = String(n.capacity)
  if (n.leadTime != null) p.leadTime = String(n.leadTime)
  if (n.risk != null) p.risk = String(n.risk)
  return p
}

function describeNode(n: TwinNode): string {
  const bits = [n.type ?? "node"]
  if (n.country) bits.push(`in ${n.country}`)
  if (n.risk != null) bits.push(`· risk ${n.risk}`)
  return bits.join(" ")
}

/** Sync a twin into DataHub. No-ops (returns 0) when DataHub is not configured. */
export async function syncTwin(graph: TwinGraph): Promise<number> {
  if (!isConfigured()) return 0
  const aspects = buildTwinAspects(graph)
  await upsertAspects(aspects)
  return aspects.length
}
