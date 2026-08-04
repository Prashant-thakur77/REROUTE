// Built-in demo supply chain — a semiconductor network with deliberate
// redundancy (dual suppliers, dual assembly sites, an air-freight backup lane)
// so failing a node produces interesting blast radii AND feasible reroutes.
//
// Served by the /api/datahub/* routes under DEMO_TWIN_ID with no database or
// login, so the public /demo page (and judges) can exercise the full flow —
// including a real DataHub sync/write-back when DataHub is configured.

import type { TwinGraph } from "./types"

export const DEMO_TWIN_ID = "demo-semi-apac"

export const DEMO_TWIN: TwinGraph = {
  supplyChainId: DEMO_TWIN_ID,
  nodes: [
    { id: "wafer-tw", name: "TSMC Wafer Fab (Taiwan)", type: "Supplier", country: "Taiwan", risk: 82, leadTime: 30, owner: "lin@fab.tw" },
    { id: "wafer-kr", name: "Samsung Foundry (Korea)", type: "Supplier", country: "South Korea", risk: 35, leadTime: 34, owner: "kim@fab.kr" },
    { id: "subcon-my", name: "Assembly & Test (Malaysia)", type: "Manufacturer", country: "Malaysia", risk: 40, leadTime: 9, owner: "ops@subcon.my" },
    { id: "subcon-ph", name: "Assembly & Test (Philippines)", type: "Manufacturer", country: "Philippines", risk: 45, leadTime: 11, owner: "ops@subcon.ph" },
    { id: "port-sg", name: "Port of Singapore", type: "Port", country: "Singapore", risk: 55, leadTime: 4 },
    { id: "air-hk", name: "HK Air Cargo Hub", type: "Port", country: "Hong Kong", risk: 38, leadTime: 1 },
    { id: "dc-nl", name: "EU Distribution (Rotterdam)", type: "Distribution", country: "Netherlands", risk: 30, leadTime: 3, owner: "eu-logistics" },
    { id: "dc-us", name: "US Distribution (Dallas)", type: "Distribution", country: "USA", risk: 25, leadTime: 2, owner: "us-logistics" },
    { id: "retail-eu", name: "EU Retail Network", type: "Retailer", country: "Germany", risk: 20, owner: "eu-sales" },
    { id: "retail-us", name: "US Retail Network", type: "Retailer", country: "USA", risk: 22, owner: "us-sales" },
  ],
  edges: [
    { source: "wafer-tw", target: "subcon-my", cost: 1200, time: 5, mode: "sea" },
    { source: "wafer-tw", target: "subcon-ph", cost: 1400, time: 6, mode: "sea" },
    { source: "wafer-kr", target: "subcon-my", cost: 1500, time: 7, mode: "sea" },
    { source: "subcon-my", target: "port-sg", cost: 300, time: 2, mode: "sea" },
    { source: "subcon-ph", target: "port-sg", cost: 450, time: 3, mode: "sea" },
    { source: "subcon-my", target: "air-hk", cost: 900, time: 1, mode: "air" },
    { source: "port-sg", target: "dc-nl", cost: 2200, time: 21, mode: "sea" },
    { source: "port-sg", target: "dc-us", cost: 2600, time: 18, mode: "sea" },
    { source: "air-hk", target: "dc-us", cost: 4800, time: 3, mode: "air" },
    { source: "dc-nl", target: "retail-eu", cost: 400, time: 3, mode: "road" },
    { source: "dc-us", target: "retail-us", cost: 380, time: 2, mode: "road" },
  ],
}

/** Whether a node id belongs to the demo twin. */
export function isDemoNodeId(nodeId: string): boolean {
  return DEMO_TWIN.nodes.some((n) => n.id === nodeId)
}
