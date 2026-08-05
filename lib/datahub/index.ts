// DataHub integration for REROUTE. The supply-chain twin becomes a DataHub
// metadata graph: nodes → datasets, edges → lineage, owners → ownership. Agents
// read topology/lineage from DataHub and write incidents/tags/docs back.
//
// All entry points no-op gracefully when DATAHUB_GMS_URL is unset, so REROUTE
// runs with or without a DataHub instance. See docs/DATAHUB_HACKATHON_PLAN.md.

export * from "./types"
export { isConfigured, getConfig, DataHubError } from "./client"
export { PLATFORM, nodeUrn, parseNodeUrn, corpUserUrn, tagUrn, TAGS } from "./urn"
export { blastRadius } from "./impact"
export { buildGroundedRationale, REVIEW_THRESHOLD } from "./rationale"
export type { GroundedRationale, GroundedClaim } from "./rationale"
export { buildTwinAspects, buildDomainAspect, buildOwnerAspects, syncTwin } from "./emit"
export { getDownstream, getOwners, entityExists } from "./read"
export { raiseIncident, resolveIncident, tagNodes, postDescription, recordDisruption } from "./writeback"
