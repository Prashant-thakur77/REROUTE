// Phase E — write REROUTE's decisions BACK into DataHub so the graph stays
// truthful and the next person/agent inherits the knowledge. This is the
// "contribute back to the graph" behaviour the hackathon rewards most.
//
//   - raiseIncident():  a disruption becomes a DataHub incident on the node
//   - tagNodes():       impacted / rerouted nodes get tagged
//   - postDescription(): the reroute rationale is written as documentation

import { graphql, isConfigured } from "./client"
import { nodeUrn, TAGS } from "./urn"
import type { BlastRadius } from "./types"

/** Raise an incident on a node. Returns the incident URN, or null if unconfigured. */
export async function raiseIncident(
  supplyChainId: string,
  nodeId: string,
  title: string,
  description: string,
  type: "OPERATIONAL" | "CUSTOM" = "OPERATIONAL"
): Promise<string | null> {
  if (!isConfigured()) return null
  const data = await graphql<{ raiseIncident: string }>(
    `mutation Raise($input: RaiseIncidentInput!) { raiseIncident(input: $input) }`,
    { input: { type, title, description, resourceUrn: nodeUrn(supplyChainId, nodeId) } }
  )
  return data.raiseIncident ?? null
}

/** Add tags to a node. No-op when unconfigured. */
export async function tagNodes(
  supplyChainId: string,
  nodeIds: string[],
  tagUrns: string[]
): Promise<void> {
  if (!isConfigured() || nodeIds.length === 0 || tagUrns.length === 0) return
  for (const id of nodeIds) {
    await graphql(
      `mutation Tag($input: AddTagsInput!) { addTags(input: $input) }`,
      { input: { tagUrns, resourceUrn: nodeUrn(supplyChainId, id) } }
    )
  }
}

/** Write documentation (description) onto a node. No-op when unconfigured. */
export async function postDescription(
  supplyChainId: string,
  nodeId: string,
  description: string
): Promise<void> {
  if (!isConfigured()) return
  await graphql(
    `mutation Doc($input: DescriptionUpdateInput!) { updateDescription(input: $input) }`,
    { input: { description, resourceUrn: nodeUrn(supplyChainId, nodeId) } }
  )
}

/**
 * One call that records a disruption end-to-end in DataHub: raise the incident,
 * tag the failed + impacted nodes, and document the blast radius on the failed
 * node. Returns the incident URN (or null when DataHub is not configured).
 */
export async function recordDisruption(
  supplyChainId: string,
  blast: BlastRadius,
  rationale: string
): Promise<string | null> {
  if (!isConfigured()) return null
  const { failedNodeId, impacted } = blast

  const incidentUrn = await raiseIncident(
    supplyChainId,
    failedNodeId,
    `Disruption at ${failedNodeId}`,
    rationale
  )

  await tagNodes(supplyChainId, [failedNodeId], [TAGS.atRisk])
  await tagNodes(
    supplyChainId,
    impacted.map((n) => n.id),
    [TAGS.impacted]
  )

  await postDescription(supplyChainId, failedNodeId, rationale)

  return incidentUrn
}
