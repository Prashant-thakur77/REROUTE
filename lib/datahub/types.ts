// Domain types for the DataHub integration. A REROUTE supply-chain twin maps
// onto DataHub's metadata graph: each node is a Dataset entity, each edge is a
// lineage relationship, node owners become Ownership, and node metrics (risk,
// lead time, capacity) become custom properties. See docs/DATAHUB_HACKATHON_PLAN.md.

/** A supply-chain node as it lives in the twin (superset of routing.RawNode). */
export interface TwinNode {
  id: string
  name?: string
  /** Supplier | Port | Factory | Manufacturer | Warehouse | Distribution | Retailer */
  type?: string
  country?: string
  capacity?: number
  leadTime?: number
  /** 0–100 risk score. */
  risk?: number
  /** Owner handle (becomes a DataHub corpuser URN). */
  owner?: string
}

/** A directed material/goods flow: `source` feeds into `target`. */
export interface TwinEdge {
  source: string
  target: string
  cost?: number
  time?: number
  mode?: string
}

export interface TwinGraph {
  supplyChainId: string
  nodes: TwinNode[]
  edges: TwinEdge[]
}

/** One impacted node in a blast-radius result. */
export interface ImpactedNode {
  id: string
  name: string
  type: string
  /** Hop distance from the failed node along downstream lineage. */
  hops: number
  /** Deterministic severity weight (higher = more business impact). */
  severity: number
  owner?: string
}

export interface BlastRadius {
  failedNodeId: string
  impacted: ImpactedNode[]
  /** Sum of impacted severities — a single blast-radius score. */
  totalSeverity: number
  /** Distinct owners of impacted nodes, for routing the alert. */
  affectedOwners: string[]
}
