# REROUTE × DataHub — Hackathon Winning Plan

**Hackathon:** Build with DataHub: The Agent Hackathon (Devpost)
**Submission window:** Jul 6 – Aug 10, 2026
**Category (primary):** Agents That Do Real Work
**Thesis:** *A supply-chain digital twin is a lineage graph. REROUTE turns DataHub
into the live metadata backbone of a supply chain — reading topology, ownership,
and health from DataHub, computing deterministic reroutes, and writing risk
assessments, incidents, and reroute decisions back so the graph stays truthful.*

---

## ✅ Build status (landed in this repo)

| Piece | File | State |
|-------|------|-------|
| Domain types (twin → graph) | `lib/datahub/types.ts` | ✅ |
| URN build/parse (pure) | `lib/datahub/urn.ts` | ✅ + tests |
| Deterministic blast radius (Phase C) | `lib/datahub/impact.ts` | ✅ + tests |
| GMS client (GraphQL + OpenAPI upsert) | `lib/datahub/client.ts` | ✅ |
| Twin → DataHub emit (Phase A) | `lib/datahub/emit.ts` | ✅ + tests |
| Lineage/owner reads (Phase B) | `lib/datahub/read.ts` | ✅ |
| Incident + tags + docs write-back (Phase E) | `lib/datahub/writeback.ts` | ✅ |
| DB → twin loader | `lib/datahub/twin-source.ts` | ✅ |
| Grounded rationale (Day 9) — URN-cited, confidence | `lib/datahub/rationale.ts` | ✅ + tests |
| DataHub read-path cross-check (agent reads DataHub) | `app/api/datahub/impact/route.ts` | ✅ |
| API routes | `app/api/datahub/{sync,impact,twin}/route.ts` | ✅ |
| **Blast-radius UI** (lineage graph + impact panel) | `app/(main)/lineage/` + `components/lineage/*` | ✅ |
| Sidebar nav entry | `components/app-sidebar.tsx` | ✅ |
| Sample outputs | `examples/` (5 real artifacts + README) | ✅ |
| Tests | `tests/datahub.test.ts` | ✅ 15 tests (52 total) |
| README disclosure + env | `README.md` | ✅ |

**Verified real API shapes used:** emit via `POST /openapi/entities/v1/`
(`DatasetProperties`/`Ownership`/`UpstreamLineage`); read via GraphQL
`scrollAcrossLineage` + `dataset.ownership`; write-back via GraphQL `raiseIncident`
/ `addTags` / `updateDescription`. All entry points no-op when `DATAHUB_GMS_URL`
is unset. DataHub is optional; build + full test suite green.

**Still to do (needs a live DataHub instance / you):** run Quickstart (or DataHub
Cloud), set `DATAHUB_GMS_URL`+`DATAHUB_TOKEN`, smoke-test the emit/read/write-back
round-trip from the **Lineage** page, deploy → live URL, record the ≤3-min video,
and the OSS bonus contribution. All code (layer + grounded rationale + read-path
cross-check + blast-radius UI + examples) is built, typechecked, and tested.

---

## 0. The one idea that makes this win

Judges reward submissions that **read the DataHub graph AND contribute back to it.**
REROUTE has a perfect, non-bolted-on mapping:

| REROUTE concept            | DataHub concept                          |
|----------------------------|------------------------------------------|
| Supply-chain node (supplier/factory/warehouse) | **Dataset / entity** (URN) |
| Material/goods flow (edge) | **Lineage** (upstream → downstream)      |
| Node owner / responsible team | **Ownership** aspect                  |
| Risk score, lead time, capacity | **Custom properties / structured properties** |
| "Node at risk > 75" fault  | **Assertion** (failing)                  |
| A disruption event         | **Incident** on the affected entity      |
| Reroute decision + rationale | **Documentation** (institutionalMemory) posted back |
| Blast radius of a failure  | **Downstream lineage traversal**         |

This is the whole pitch: **the digital twin lives in DataHub**, the agents reason
over it via the MCP Server, and every decision is written back so the next
person/agent inherits it. That is verbatim the "Agents That Do Real Work"
category definition.

---

## 1. Judging criteria → how we max each

The criteria are roughly equally weighted. Plan to visibly win each one.

### 1a. Use of DataHub  ← most important, and a pass/fail gate
- **Read:** agents pull topology, lineage, ownership, and assertions from DataHub
  via the **MCP Server** + **Agent Context Kit** — DataHub is the source of truth,
  not just Supabase.
- **Write back:** REROUTE emits **assertions** (node health), **incidents**
  (disruptions), **tags** (at-risk / rerouted), and **documentation** (the reroute
  rationale) into DataHub. This is the "contribute back to the graph" bonus.
- **Deliverable proof:** a screen in the demo showing DataHub UI updating live as
  REROUTE runs.

### 1b. Technical Execution
- The **deterministic blast-radius + reroute** engine over the lineage DAG (not an
  LLM guess) — provable, testable, fast. Reuse REROUTE's existing weighted-Dijkstra
  and grounding patterns.
- End-to-end working: DataHub → agents → reroute → write-back → UI.

### 1c. Originality (go beyond DataHub's built-in features)
- DataHub *shows* lineage; it does not autonomously **triage a disruption, compute
  a reroute, route it to the right owners, and write the decision back with a
  grounded rationale.** That's the novel layer.

### 1d. Real-World Usefulness
- Supply-chain disruption is a real, expensive problem. Impact analysis via lineage
  + deterministic rerouting is a genuine operations use case.

### 1e. Submission Quality
- Clean README with a one-command demo, `examples/` folder of generated artifacts,
  a tight ≤3-min video, and a live URL.

### 1f. Bonus — open-source contribution
- Contribute one small thing upstream (a DataHub **Skill**, a connector example, or
  a doc fix). Cheap points, explicitly rewarded.

---

## 2. Mandatory gates (pass/fail — do these or the entry is void)

- [ ] **Uses DataHub open source** (MCP Server / Agent Context Kit / Skills). ← the big one
- [ ] **Public repo**, **Apache-2.0 LICENSE** in the repo and shown in the About.
- [ ] **Working demo URL** (deployed).
- [ ] **≤3-minute demo video.**
- [ ] `examples/` folder with sample outputs.

> Disclosure note: REROUTE reuses a prior design system, motion primitives, and the
> deterministic-routing/grounding modules. State this plainly in the README

## 3. Integration architecture

```
                    ┌─────────────────────────────────────────┐
                    │  DataHub (local Quickstart, Apache-2.0)  │
                    │  - supply-chain entities (nodes) + URNs  │
                    │  - lineage (edges), ownership, props     │
                    │  - assertions, incidents, docs, tags     │
                    └──────────────▲───────────────┬──────────┘
             read (MCP / ACK)      │               │  write-back (SDK emitters)
                                   │               ▼
  ┌────────────────────────────────┴───────────────────────────────────────┐
  │  REROUTE agent layer                                                     │
  │                                                                         │
  │  A. Twin Sync      push Supabase twin → DataHub entities+lineage        │
  │  B. Sensor         read failing assertions / risk>75 nodes from DataHub │
  │  C. Impact engine  DETERMINISTIC downstream traversal = blast radius    │
  │  D. Reroute engine weighted-Dijkstra alternate path (existing lib)      │
  │  E. Grounded LLM   rationale, each claim cited to a DataHub URN         │
  │  F. Actuator       WRITE BACK: incident + tags + doc + owner notify     │
  └─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
              REROUTE UI: lineage graph + blast radius + agent reasoning
```

**Three DataHub wiring points (use all three — depth scores):**
1. **MCP Server** — the agent's read/act tools: search entities, get lineage
   (upstream/downstream), read ownership + assertions.
2. **Agent Context Kit** — structured graph context fed to the agents so their
   reasoning is grounded in real metadata.
3. **DataHub Python SDK (`acryl-datahub`) emitters** — the write-back: emit
   `MetadataChangeProposal`s for assertions, incidents, tags, and documentation.
   *(Confirm exact aspect/emitter names against current DataHub docs; the concepts
   — entities/aspects, `upstreamLineage`, `ownership`, `assertions`,
   `institutionalMemory` — are stable.)*

---

## 4. What to build (concrete work items)

### Phase A — DataHub up + twin sync (foundation)
- Run DataHub Quickstart locally. Load a sample dataset for the demo backdrop
  (**showcase-ecommerce** for rich cross-platform lineage; or model our own supply
  chain as entities).
- **`lib/datahub/emit.ts` (or a small Python service):** map a REROUTE twin
  (Supabase nodes+edges) → DataHub entities + `upstreamLineage` + `ownership` +
  custom properties (risk, lead time, capacity). One command: `sync-twin`.

### Phase B — Read path (agents source truth from DataHub)
- **`lib/datahub/read.ts`:** wrappers over the MCP Server — `getLineage(urn)`,
  `getOwners(urn)`, `getAssertions(urn)`, `searchNodes(query)`.
- Wire the existing risk/scan agents to read topology + ownership from DataHub.

### Phase C — Deterministic impact + reroute
- **`lib/impact.ts`:** downstream lineage BFS → blast-radius set; severity =
  `w_type · γ^hops`. Owner routing = union of ownership on impacted nodes, grouped
  by domain. Fully unit-tested (reuse the routing test patterns).
- Reuse **`lib/routing.ts`** (weighted-Dijkstra) for the alternate path.

### Phase D — Grounded rationale
- Reuse **`lib/grounding.ts`**: every LLM sentence cites the DataHub URN it came
  from; emit a confidence score; flag "needs review" when lineage is partial.

### Phase E — Write-back (the criterion-winning piece)
- **`lib/datahub/writeback.ts`:** on a disruption →
  - create an **incident** on the failed entity,
  - **tag** impacted nodes (`at-risk`, `rerouted`),
  - post the **reroute rationale as documentation**,
  - update a node-health **assertion**.
- Notify owners (Slack/email) with the impacted-owner list.

### Phase F — UI + demo surface
- A screen showing the lineage graph with the **blast radius highlighted**, the
  agent's grounded reasoning, and "owners notified / written back to DataHub."
- Split-screen the DataHub UI so judges see it update live.

---

## 5. Demo data

- **Primary:** model a REROUTE supply chain (10–20 nodes) as DataHub entities so the
  lineage + reroute is our own story and fully controllable.
- **Backdrop credibility:** also load **showcase-ecommerce** (cross-platform
  lineage) to show REROUTE works against real-world DataHub metadata, not just our
  toy graph.

---

## 6. Revised schedule — 2 hours/day (from Jul 28, deadline Aug 10)

The whole data/agent layer (Phases A, B, C, E) is **already built and tested**. The
remaining work is: make it run against a live DataHub, add the demo UI, deploy, and
submit. Nine ~2h sessions with a 2–3 day buffer before the deadline. Each session
has ONE shippable outcome so a 2h block is never wasted.

> **Legend:** 🧑 = you (your machine / Docker / accounts) · 🤖 = Claude builds it with you.

| # | Session (≈2h) | Outcome | Owner |
|---|----------------|---------|-------|
| **1** | **Stand up DataHub + de-risk** | `datahub docker quickstart` running; access token created; `DATAHUB_GMS_URL`/`DATAHUB_TOKEN` in `.env`. Add **Apache-2.0 LICENSE**, make repo **public**. | 🧑 (🤖 guides) |
| **2** | **Live round-trip** | Run `/api/datahub/sync` on a seeded twin → nodes + lineage + ownership appear in the DataHub UI. Reconcile any field/name mismatches the real GMS rejects. | 🤖+🧑 |
| **3** | **Write-back round-trip** | Run `/api/datahub/impact` → incident + tags + documentation appear on the failed node in DataHub. This is the criterion-winning proof. | 🤖+🧑 |
| **4** | **Day 9 — grounded rationale** | Wire the impact rationale through `lib/grounding.ts`: each claim cites a DataHub URN + confidence; "needs review" flag when lineage is partial. Tests. | 🤖 |
| **5** | **Blast-radius UI (build)** | A page that calls `/api/datahub/impact` and renders the lineage graph with the blast radius highlighted, impacted owners, and severity. | 🤖 |
| **6** | **Blast-radius UI (polish + DataHub links)** | Deep-link each impacted node to its DataHub entity page; show the "written back → incident URN" state. Cool Slate polish. Demo-ready. | 🤖 |
| **7** | **Agent read-path + examples/** | Add a DataHub tool to the ADK agents (an agent reads live lineage/owners). Generate `examples/` sample outputs (incident + blast-radius JSON + screenshots). | 🤖 |
| **8** | **Deploy + OSS bonus** | Deploy to Cloud Run/Vercel → **live URL** (see DataHub-reachability note below). Open one small upstream PR (a DataHub Skill / doc fix / connector example). | 🤖+🧑 |
| **9** | **Video + submit** | Record the ≤3-min demo (script in §7). Final checklist pass. Submit on Devpost. | 🧑 (🤖 drafts script/copy) |

**Buffer:** Aug 8–10 free for slippage, re-record, or judging-prep.

### ⚠️ One decision to make in Session 1: where DataHub lives
A deployed app on Cloud Run/Vercel **cannot reach a DataHub running on your
`localhost`.** Pick one so the live URL genuinely writes back:
- **A. DataHub Cloud trial (acryl.io)** — easiest; a hosted GMS URL + token the
  deployed app can reach. *Recommended.*
- **B. DataHub on a small cloud VM** — more setup, full control.
- **C. Local-only** — deployed app shows the impact math; the DataHub write-back is
  demoed in the video against local. Weakest for the "live" requirement.

### If a session runs short, cut in this order (protect the score)
Keep: live round-trip (2–3), write-back (3), UI (5–6), deploy+video (8–9).
Cut first: agent read-path tool (7), OSS bonus (8), backdrop showcase-ecommerce.

---

## 7. Demo video script (≤3 minutes)

1. **Hook (15s):** "A supplier goes down. Which customers are affected, who owns the
   fix, and what's the reroute? Today that takes a war-room. Watch REROUTE do it in
   seconds — on top of DataHub."
2. **Setup (20s):** Show the supply chain as a **lineage graph in DataHub** (nodes,
   ownership).
3. **Trigger (30s):** A node fails (assertion goes red). REROUTE's sensor picks it
   up from DataHub.
4. **Impact (30s):** Deterministic **blast radius** highlights downstream nodes +
   the affected owners/domains.
5. **Reroute + grounding (35s):** Weighted-Dijkstra alternate path; grounded
   rationale with each claim **cited to a DataHub URN** + confidence.
6. **Write-back (35s):** Split-screen — an **incident, tags, and the reroute doc
   appear live in DataHub**; owners get notified.
7. **Close (15s):** "Reads DataHub, decides with deterministic math, and writes the
   knowledge back so the graph stays true."

---

## 8. Submission checklist

- [ ] Public repo + Apache-2.0 (About section shows the license)
- [ ] DataHub MCP Server / Agent Context Kit / Skills all used
- [ ] Write-back to DataHub demonstrated (incident + tags + docs)
- [ ] `examples/` with sample generated incidents/docs/reroutes
- [ ] README: setup, one-command demo, **pre-existing-code disclosure**
- [ ] Live deployed URL
- [ ] ≤3-min video
- [ ] OSS bonus: one upstream contribution linked

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| DataHub integration reads as bolted-on | Make DataHub the *source of truth* for topology/ownership, not a side export. Agents must **read** from it, not just write. |
| Write-back API unfamiliarity eats time | Spike the emitter path on day 1–2 against the docs before building UI. |
| Demo too abstract | Use our own 10–20 node supply chain so the story is concrete and controllable. |
| Eligibility question on pre-existing code | Disclose reused modules plainly in the README, as the rules permit. |
| Live URL flaky during judging | Deploy early (day 13), smoke-test, keep a fallback recording. |

---

## 10. What REROUTE reuses (disclose in README)

- Cool Slate design system, motion primitives, UI components.
- `lib/routing.ts` (deterministic Dijkstra), `lib/grounding.ts` (confidence +
  citations), `lib/import/twin-import.ts` (CSV/XLSX → twin).
- 13-agent ADK/Gemini orchestration, Supabase persistence.

**New for this hackathon:** the entire `lib/datahub/*` layer (emit/read/writeback),
`lib/impact.ts` (lineage blast radius), the DataHub-sourced sensor path, and the
blast-radius UI + DataHub split-screen.
