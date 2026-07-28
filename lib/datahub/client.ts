// Thin HTTP client for a DataHub GMS instance. Two surfaces:
//   - graphql(): the /api/graphql endpoint (reads + mutations)
//   - upsertAspects(): the /openapi/entities/v1/ endpoint (entity/aspect writes)
//
// DataHub is OPTIONAL. If DATAHUB_GMS_URL is unset, isConfigured() is false and
// callers no-op, so REROUTE runs exactly as before without a DataHub instance.

export interface DataHubConfig {
  gmsUrl: string
  token?: string
}

export function getConfig(): DataHubConfig | null {
  const gmsUrl = process.env.DATAHUB_GMS_URL?.replace(/\/+$/, "")
  if (!gmsUrl) return null
  return { gmsUrl, token: process.env.DATAHUB_TOKEN }
}

export function isConfigured(): boolean {
  return getConfig() !== null
}

function authHeaders(cfg: DataHubConfig): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (cfg.token) h.Authorization = `Bearer ${cfg.token}`
  return h
}

export class DataHubError extends Error {}

/** Run a GraphQL query/mutation against GMS. Throws DataHubError on failure. */
export async function graphql<T = any>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const cfg = getConfig()
  if (!cfg) throw new DataHubError("DataHub is not configured (DATAHUB_GMS_URL unset)")

  const res = await fetch(`${cfg.gmsUrl}/api/graphql`, {
    method: "POST",
    headers: authHeaders(cfg),
    body: JSON.stringify({ query, variables: variables ?? {} }),
  })
  if (!res.ok) {
    throw new DataHubError(`DataHub GraphQL HTTP ${res.status}: ${await safeText(res)}`)
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) {
    throw new DataHubError(`DataHub GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`)
  }
  return json.data as T
}

/** One entity/aspect pair for the OpenAPI upsert endpoint. */
export interface AspectUpsert {
  entityType: string
  entityUrn: string
  aspect: Record<string, unknown> & { __type: string }
}

/**
 * UPSERT a batch of aspects via POST /openapi/entities/v1/.
 * A post with no extra params upserts the given aspects.
 */
export async function upsertAspects(aspects: AspectUpsert[]): Promise<void> {
  const cfg = getConfig()
  if (!cfg) throw new DataHubError("DataHub is not configured (DATAHUB_GMS_URL unset)")
  if (aspects.length === 0) return

  const res = await fetch(`${cfg.gmsUrl}/openapi/entities/v1/`, {
    method: "POST",
    headers: authHeaders(cfg),
    body: JSON.stringify(aspects),
  })
  if (!res.ok) {
    throw new DataHubError(`DataHub upsert HTTP ${res.status}: ${await safeText(res)}`)
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return "<no body>"
  }
}
