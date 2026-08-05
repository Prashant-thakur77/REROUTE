// Read path via the official DataHub MCP Server (acryldata/mcp-server-datahub).
// The hackathon's required wiring: REROUTE's agent reads the DataHub graph
// through MCP tools (search / get_lineage / get_entities). We spawn the server
// over stdio and keep one connection for the process lifetime.
//
// Fully optional: if the binary or DataHub is unavailable (e.g. the deployed
// container), callers fall back to the direct GraphQL read path in read.ts.

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { getConfig } from "./client"
import { parseNodeUrn } from "./urn"
import type { LineageHit } from "./read"

let clientPromise: Promise<Client | null> | null = null

async function connect(): Promise<Client | null> {
  const cfg = getConfig()
  if (!cfg) return null
  try {
    const transport = new StdioClientTransport({
      command: process.env.DATAHUB_MCP_COMMAND ?? "mcp-server-datahub",
      args: [],
      env: {
        ...(process.env as Record<string, string>),
        DATAHUB_GMS_URL: cfg.gmsUrl,
        ...(cfg.token ? { DATAHUB_GMS_TOKEN: cfg.token } : {}),
      },
    })
    const client = new Client({ name: "reroute-agent", version: "1.0.0" })
    await withTimeout(client.connect(transport), 10_000)
    return client
  } catch (err) {
    console.warn("[datahub/mcp] unavailable, falling back to GraphQL:", (err as Error)?.message)
    return null
  }
}

/** Singleton MCP client (or null when the MCP server can't be spawned). */
export function getMcpClient(): Promise<Client | null> {
  if (!clientPromise) clientPromise = connect()
  return clientPromise
}

/**
 * Downstream lineage of a dataset via the MCP `get_lineage` tool.
 * Returns null (not []) when MCP is unavailable so callers can fall back.
 */
export async function mcpGetDownstream(urn: string, maxHops = 5): Promise<LineageHit[] | null> {
  const client = await getMcpClient()
  if (!client) return null
  try {
    const res: any = await withTimeout(
      client.callTool({
        name: "get_lineage",
        arguments: { urn, upstream: false, max_hops: maxHops },
      }),
      15_000
    )
    const text = res?.content?.[0]?.text
    if (!text) return null
    const data = JSON.parse(text)
    const results: any[] = data?.downstreams?.searchResults ?? []
    return results.map((r) => ({
      urn: r.entity?.urn ?? "",
      nodeId: r.entity?.urn ? (parseNodeUrn(r.entity.urn)?.nodeId ?? null) : null,
      degree: r.degree ?? 1,
    }))
  } catch (err) {
    console.warn("[datahub/mcp] get_lineage failed:", (err as Error)?.message)
    return null
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}
