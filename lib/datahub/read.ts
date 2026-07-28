// Phase B — read the supply-chain graph back FROM DataHub. Agents source
// topology, lineage, and ownership from DataHub (the metadata source of truth)
// rather than only from Supabase. Uses the GMS GraphQL API.

import { graphql, isConfigured } from "./client"
import { parseNodeUrn } from "./urn"

export interface LineageHit {
  urn: string
  nodeId: string | null
  degree: number
}

/**
 * Downstream nodes of a dataset URN, via scrollAcrossLineage. `degree` is hop
 * distance. Returns [] when DataHub is not configured.
 */
export async function getDownstream(urn: string, count = 100): Promise<LineageHit[]> {
  if (!isConfigured()) return []
  const data = await graphql<{
    scrollAcrossLineage: { searchResults: { degree: number; entity: { urn: string } }[] }
  }>(
    `query Downstream($urn: String!, $count: Int!) {
      scrollAcrossLineage(input: {
        query: "*", urn: $urn, count: $count, direction: DOWNSTREAM
      }) {
        searchResults { degree entity { urn } }
      }
    }`,
    { urn, count }
  )
  return (data.scrollAcrossLineage?.searchResults ?? []).map((r) => ({
    urn: r.entity.urn,
    nodeId: parseNodeUrn(r.entity.urn)?.nodeId ?? null,
    degree: r.degree,
  }))
}

export interface OwnerInfo {
  urn: string
  handle: string
}

/** Owners of a dataset URN. Returns [] when DataHub is not configured. */
export async function getOwners(urn: string): Promise<OwnerInfo[]> {
  if (!isConfigured()) return []
  const data = await graphql<{
    dataset: { ownership: { owners: { owner: { urn: string } }[] } | null } | null
  }>(
    `query Owners($urn: String!) {
      dataset(urn: $urn) { ownership { owners { owner { urn } } } }
    }`,
    { urn }
  )
  const owners = data.dataset?.ownership?.owners ?? []
  return owners.map((o) => ({
    urn: o.owner.urn,
    handle: o.owner.urn.replace(/^urn:li:corpuser:/, ""),
  }))
}

/** Whether a dataset entity exists in DataHub. */
export async function entityExists(urn: string): Promise<boolean> {
  if (!isConfigured()) return false
  const data = await graphql<{ entity: { urn: string } | null }>(
    `query Exists($urn: String!) { entity(urn: $urn) { urn } }`,
    { urn }
  )
  return Boolean(data.entity?.urn)
}
