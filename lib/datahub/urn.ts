// Pure URN construction/parsing for the DataHub graph. No network — safe to unit
// test. REROUTE registers its own data platform ("reroute") so supply-chain
// nodes are first-class datasets in DataHub.

export const PLATFORM = "reroute"

/** Dataset URN for a supply-chain node, namespaced by supply chain. */
export function nodeUrn(supplyChainId: string, nodeId: string): string {
  const name = `${supplyChainId}.${nodeId}`
  return `urn:li:dataset:(urn:li:dataPlatform:${PLATFORM},${name},PROD)`
}

/** Extract { supplyChainId, nodeId } back out of a node dataset URN, or null. */
export function parseNodeUrn(urn: string): { supplyChainId: string; nodeId: string } | null {
  const m = urn.match(/^urn:li:dataset:\(urn:li:dataPlatform:[^,]+,(.+),[A-Z]+\)$/)
  if (!m) return null
  const name = m[1]
  const dot = name.indexOf(".")
  if (dot < 0) return null
  return { supplyChainId: name.slice(0, dot), nodeId: name.slice(dot + 1) }
}

/** corpuser URN for an owner handle (email local-part or username). */
export function corpUserUrn(owner: string): string {
  const handle = owner.includes("@") ? owner.split("@")[0] : owner
  return `urn:li:corpuser:${handle}`
}

/** Tag URN by name. */
export function tagUrn(name: string): string {
  return `urn:li:tag:${name}`
}

export const TAGS = {
  atRisk: tagUrn("reroute-at-risk"),
  rerouted: tagUrn("reroute-rerouted"),
  impacted: tagUrn("reroute-impacted"),
} as const
