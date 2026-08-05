// Phase A — push a REROUTE twin INTO DataHub so the supply chain becomes a
// first-class metadata graph: one Dataset per node, Ownership per owner, custom
// properties for risk/lead-time/capacity, and UpstreamLineage for the edges.
//
// buildTwinAspects() is pure (no network) and unit tested; syncTwin() posts them.

import { upsertAspects, isConfigured, type AspectUpsert } from "./client"
import { nodeUrn, corpUserUrn, PLATFORM, TAGS, DOMAIN_URN } from "./urn"
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

/** Governance domain grouping every REROUTE supply-chain asset. */
export function buildDomainAspect(): AspectUpsert {
  return {
    entityType: "domain",
    entityUrn: DOMAIN_URN,
    aspect: {
      __type: "DomainProperties",
      name: "Supply Chain",
      description:
        "Physical supply-chain nodes managed by REROUTE — suppliers, factories, ports, distribution, retail.",
    },
  }
}

/**
 * Real corpUser profiles for node owners, so ownership renders as people with
 * names in DataHub instead of bare URNs.
 */
export function buildOwnerAspects(graph: TwinGraph): AspectUpsert[] {
  const owners = new Map<string, string>() // urn → display handle
  for (const n of graph.nodes) {
    if (!n.owner) continue
    owners.set(corpUserUrn(n.owner), n.owner)
  }
  return Array.from(owners.entries()).map(([urn, handle]) => ({
    entityType: "corpUser",
    entityUrn: urn,
    aspect: {
      __type: "CorpUserInfo",
      active: true,
      displayName: handle.includes("@") ? handle.split("@")[0] : handle,
      email: handle.includes("@") ? handle : undefined,
      title: "Supply-chain owner",
    },
  }))
}

/**
 * Build the full aspect list for a twin — DatasetProperties + Ownership +
 * UpstreamLineage + Domains + a link back to REROUTE per node. Deterministic
 * and side-effect free (the doc link timestamp is fixed at 0 = "unknown").
 */
export function buildTwinAspects(graph: TwinGraph): AspectUpsert[] {
  const { supplyChainId, nodes, edges } = graph

  // Register the custom platform, REROUTE's tags, the governance domain, and
  // owner profiles first so datasets can attach to them.
  const out0: AspectUpsert[] = [
    buildPlatformAspect(),
    ...buildTagAspects(),
    buildDomainAspect(),
    ...buildOwnerAspects(graph),
  ]

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

    // Governance: every node belongs to the Supply Chain domain.
    out.push({
      entityType: "dataset",
      entityUrn: urn,
      aspect: { __type: "Domains", domains: [DOMAIN_URN] },
    })

    // Bidirectional loop: each DataHub asset links back to the live REROUTE view.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    if (appUrl) {
      out.push({
        entityType: "dataset",
        entityUrn: urn,
        aspect: {
          __type: "InstitutionalMemory",
          elements: [
            {
              url: `${appUrl.replace(/\/+$/, "")}/demo`,
              description: "Open this node in REROUTE (lineage, blast radius, reroutes)",
              createStamp: { time: 0, actor: "urn:li:corpuser:__datahub_system" },
            },
          ],
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
