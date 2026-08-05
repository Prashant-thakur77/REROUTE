# Devpost Submission Copy — ready to paste

Fill each Devpost field from the sections below. Replace `<LIVE_URL>`,
`<REPO_URL>`, `<VIDEO_URL>` before submitting.

---

## Project name

**REROUTE — Supply-Chain Incident Response on the DataHub Graph**

## Elevator pitch (tagline, ~200 chars)

> A supply chain **is** a lineage graph. REROUTE makes DataHub its metadata
> backbone: when a node fails, deterministic math computes the blast radius +
> reroute, and the incident is written back to DataHub.

## Category

**Agents That Do Real Work** (also fits Open/Wildcard)

---

## Inspiration

Data teams learn about broken pipelines the same way supply-chain teams learn
about broken suppliers: downstream, too late, from an angry stakeholder. DataHub
solved discoverability for data assets — lineage, ownership, incidents. We
realised a supply-chain digital twin maps onto that same metadata model almost
1:1: nodes are datasets, goods flows are lineage, plant managers are owners,
disruptions are incidents. So instead of bolting a dashboard onto a database, we
made **DataHub itself the supply chain's metadata backbone** — and put an agent
on top that does the work a war-room does.

## What it does

1. **Syncs the twin into DataHub** — every supplier/factory/port/warehouse
   becomes a Dataset under a custom `reroute` data platform, goods flows become
   `UpstreamLineage`, plant owners become `Ownership`, risk/lead-time become
   custom properties.
2. **Detects + triages a failure** — click any node (or let the monitoring
   agents flag one): a **deterministic BFS over the lineage DAG** computes the
   blast radius (severity = type-weight · γ^hops), so impact is provable, not an
   LLM guess.
3. **Computes the reroute** — weighted **Dijkstra** finds alternate routes
   around the failed node, with added cost/time per recovered segment (the
   product's namesake).
4. **Explains with grounding** — the rationale cites a **DataHub URN for every
   claim**, carries a confidence score derived from lineage completeness, and
   flags "needs human review" below 0.6.
5. **Writes knowledge back** — the disruption becomes a DataHub **incident**,
   impacted assets get **tags**, and the rationale lands as **documentation** —
   so the graph stays truthful and the next person or agent inherits it.
6. **Cross-checks itself via MCP** — the agent reads the downstream lineage back
   through the **DataHub MCP Server** (`get_lineage`) and verifies DataHub's
   graph agrees with the local computation before acting.
7. **Closes the loop** — when the operator actions the reroute, REROUTE
   **resolves the incident** in DataHub. Raise → investigate → resolve, full
   lifecycle in the graph.

**Try it with zero setup:** `<LIVE_URL>/demo` — public, no login, running on the
built-in semiconductor twin (dual fabs, dual assembly sites, an air-freight
backup lane).

## How we built it

- **DataHub (open source) + the official MCP Server** — the agent reads lineage
  through **`mcp-server-datahub`** (the `get_lineage` MCP tool over stdio), with
  GMS **GraphQL** as fallback (`scrollAcrossLineage`, `raiseIncident`, `addTags`,
  `updateIncidentStatus`, `updateDescription`, ownership queries) + the
  **OpenAPI entities endpoint** for aspect upserts (`DatasetProperties`,
  `Ownership`, `UpstreamLineage`, `Domains`, `CorpUserInfo`,
  `InstitutionalMemory`, `DataPlatformInfo`, `TagProperties`).
- **Next.js 16 / TypeScript / React 19** — app, API routes, and the lineage UI
  (pure layered-DAG layout, SVG, theme-aware).
- **Deterministic core** — graph algorithms (BFS blast radius, weighted
  Dijkstra) with 20 dedicated unit tests; **the AI explains, the math decides**.
- **Google ADK + Gemini** — the 13-agent monitoring system that surfaces threats
  (weather, news, geopolitical) feeding the disruption flow.
- **Supabase** — user supply chains; the demo twin runs database-free.

## Challenges we ran into

- Mapping a physical supply chain onto DataHub's metamodel *honestly* — the
  breakthrough was treating flows as lineage rather than inventing custom
  entities, which made every native DataHub feature (lineage view, incidents,
  ownership) work for free.
- Keeping trust: LLM narratives sound right even when wrong. We inverted the
  architecture — algorithms produce the facts, the narrative cites a URN for
  every sentence, and weak grounding is flagged for human review.

## Accomplishments we're proud of

- A **zero-login public demo** where a judge can break a supply chain and watch
  the incident appear in DataHub.
- Deterministic blast-radius + reroute engines with **52 passing tests**.
- Full **read + write** DataHub integration — not a read-only viewer.

## What we learned

DataHub's aspect model is expressive enough to be a **general operational
graph**, not only a data catalog. Ownership + lineage + incidents turn out to be
exactly the primitives incident response needs — in any domain.

## What's next

- Emit node-health **assertions** so DataHub's own UI shows red/green health.
- Slack owner notifications from the `Ownership` aspect.
- MCP-server tools so any agent (not just ours) can ask "what breaks if X fails?"

---

## Built with

`datahub` · `next.js` · `typescript` · `react` · `graphql` · `google-adk` ·
`gemini` · `supabase` · `tailwindcss` · `vitest` · `docker` · `cloud-run`

## Links

- **Live demo (no login):** `<LIVE_URL>/demo`
- **Full app:** `<LIVE_URL>`
- **Repo (Apache-2.0):** `<REPO_URL>`
- **Video:** `<VIDEO_URL>`
- **Sample outputs:** `<REPO_URL>/tree/main/examples`

## Disclosure (required — paste verbatim)

> REROUTE's design system, motion primitives, deterministic-routing
> (`lib/routing.ts`) and grounding (`lib/grounding.ts`) modules, and the
> 13-agent ADK monitoring core pre-date this hackathon and are reused as
> disclosed pre-existing code. **Built new during the submission period:** the
> entire DataHub integration (`lib/datahub/*` — emit/read/write-back/URNs), the
> blast-radius impact engine, the URN-grounded rationale layer, the lineage +
> impact UI, the public demo, and the `/api/datahub/*` routes.
