# 🏁 Your Steps to Win — DataHub Hackathon Checklist

**Deadline:** Aug 10, 2026 (Devpost) · **Budget:** ~2 h/day
**Everything code-side is DONE.** What remains is environment setup, a live
round-trip check, deploy, video, and the Devpost form — all yours, with exact
commands below. Companion docs: [DATAHUB_HACKATHON_PLAN.md](DATAHUB_HACKATHON_PLAN.md).

---

## Part 1 — ✅ What is already done (no action needed)

| Area | What exists | Where |
|------|-------------|-------|
| DataHub layer | emit / read / write-back / client, all no-op without env | `lib/datahub/` |
| Twin → DataHub | nodes→datasets, edges→lineage, owners→ownership, custom platform registered | `lib/datahub/emit.ts` |
| Deterministic blast radius | downstream BFS, severity = typeWeight·γ^hops | `lib/datahub/impact.ts` |
| Grounded rationale | every claim cites a DataHub URN + confidence + needs-review | `lib/datahub/rationale.ts` |
| Write-back | `raiseIncident` + `addTags` + `updateDescription` on disruption | `lib/datahub/writeback.ts` |
| Read-path proof | impact route reads downstream lineage from DataHub and cross-checks | `app/api/datahub/impact/route.ts` |
| API | `/api/datahub/sync` · `/api/datahub/impact` · `/api/datahub/twin` | `app/api/datahub/` |
| **Lineage UI** | click a node → blast radius + cited reasoning + write-back state | `/lineage` page |
| **Deterministic reroute in the flow** | weighted Dijkstra around the failed node, in the API response, the cited rationale, AND the incident written to DataHub | impact route + `rationale.ts` |
| **Public zero-login demo** 🌟 | judges hit `<LIVE_URL>/demo` and immediately break a built-in semiconductor twin (dual fabs, air-freight backup lane) — no account, no CSV, no database | `/demo` + `lib/datahub/demo-twin.ts` |
| Examples | 6 real generated artifacts + README | `examples/` |
| Tests | 57 passing (20 DataHub) | `tests/datahub.test.ts` |
| **Apache-2.0 LICENSE** | mandatory gate — in repo + package.json | `LICENSE` |
| README | DataHub section + env vars + pre-existing-code disclosure | `README.md` |
| **Devpost copy, ready to paste** | every form field pre-written (pitch, what-it-does, challenges, disclosure) | `docs/DEVPOST_SUBMISSION.md` |

---

## Part 2 — 🧑 Your steps, in order

### Step 1 — Stand up DataHub (~1 session)

**Decide first:** local Quickstart (fastest to try) vs **DataHub Cloud trial**
(needed if you want the *deployed* site to write back — a Cloud Run app cannot
reach your laptop's localhost). Recommended: start local today, request the
cloud trial in parallel.

**Local Quickstart (needs Docker + ~8 GB free RAM):**
```bash
# 1. Install the CLI
python3 -m pip install --upgrade acryl-datahub

# 2. Launch DataHub (pulls containers; first run takes minutes)
datahub docker quickstart

# 3. Open the UI and sign in (default user/pass on first run: datahub / datahub)
#    UI:  http://localhost:9002       GMS API:  http://localhost:8080
```

**Create an access token:** UI → ⚙️ Settings → Access Tokens → Generate.

**Wire REROUTE to it — add to your `.env`:**
```env
DATAHUB_GMS_URL=http://localhost:8080
DATAHUB_TOKEN=<the token you generated>
NEXT_PUBLIC_DATAHUB_URL=http://localhost:9002
```

✅ *Done when:* the DataHub UI loads and you have a token in `.env`.

### Step 2 — Live round-trip smoke test (~1 session)

```bash
pnpm dev   # start REROUTE
```

1. Open **/demo** (no login needed!) or **/lineage**. Header badge should read
   **“DataHub connected”**.
2. On /demo the **Semiconductor APAC (demo)** chain is pre-selected → click
   **Sync to DataHub**. Expect “Synced N aspects”. (On /lineage you can also
   pick any of your own chains — the demo chain is in every dropdown.)
3. In the DataHub UI, search one of your node names — the dataset should exist
   with **Lineage** (upstream/downstream), **Properties** (risk, leadTime), and
   **Ownership** if you set owners.
4. **Click the “Port of Singapore” node** to fail it. Expect: blast radius
   lights up, **Alternate routes** panel shows the HK air-freight recovery
   (+$ but −17d) and one severed lane, cited reasoning panel renders, and
   **“Incident written back to DataHub.”**
5. In DataHub, open that node → **Incidents** tab: the incident is there; the
   impacted nodes carry `reroute-impacted` tags.

If anything 4xx/5xxs: tell Claude the exact response body — likely a small
aspect-shape fix (one session, done together).

✅ *Done when:* incident + tags + lineage all visible in the DataHub UI.

### Step 3 — Make the repo public (5 min)

GitHub → repo → Settings → General → Danger Zone → **Change visibility → Public**.
Check the About panel shows **Apache-2.0 license** (it will, from `LICENSE`).

✅ *Done when:* repo is public and the license shows.

### Step 4 — Deploy → live URL (~1 session)

Existing pipeline (see [DEPLOYMENT.md](DEPLOYMENT.md)):
```bash
# .env.yaml must now ALSO contain:
#   DATAHUB_GMS_URL: "<your DataHub Cloud GMS url>"     ← cloud, not localhost!
#   DATAHUB_TOKEN: "<token>"
pnpm run deploy:gcp
```
> If the DataHub Cloud trial hasn’t come through: deploy anyway. The Lineage
> page still demos the deterministic blast radius + grounded reasoning (it says
> “DataHub not configured” for write-back), and your **video** shows the full
> round-trip against local DataHub. Judges get a live URL either way.

Smoke-test the deployed URL: sign in → /lineage → click a node.

✅ *Done when:* the public URL works end-to-end.

### Step 5 — Record the ≤3-min video (~1 session)

Follow the shot list in [DATAHUB_HACKATHON_PLAN.md §7](DATAHUB_HACKATHON_PLAN.md).
Practical tips:
- **Record on `/demo`** — it's the cleanest surface (no sidebar noise) and lets
  you say “try this yourself, no login” on camera.
- Fail **Port of Singapore**: it gives the best story — big blast radius, one
  feasible air-freight reroute (−17 days!), one severed lane, High severity.
- Screen-record at 1080p; split-screen **REROUTE /demo (left)** and the
  **DataHub UI (right)** for the trigger→write-back moment — that split screen
  IS the winning shot.
- Script beats: hook (war-room pain) → twin lives in DataHub → click node →
  blast radius + cited claims → incident appears in DataHub live → close
  (“reads the graph, decides with math, writes knowledge back”).
- Keep a silent 5-sec buffer at the start; Devpost trims oddly.

✅ *Done when:* video uploaded (YouTube unlisted works) and under 3:00.

### Step 6 — Submit on Devpost (~1 session)

**Every field is pre-written in [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md)** —
paste each section, replacing `<LIVE_URL>`, `<REPO_URL>`, `<VIDEO_URL>`.
Include the disclosure paragraph verbatim (required, and it protects you), and
put **`<LIVE_URL>/demo`** first in the links — that’s the judge’s one-click try.

✅ *Done when:* Devpost shows “Submitted”.

### Step 7 — Optional bonus (only if time remains)

- **OSS contribution:** open one small PR upstream (DataHub docs fix or an
  example). Judges explicitly award this. Ask Claude to find a good
  first-issue candidate.
- **DataHub Cloud** swap-in for the deployed URL if the trial arrives late.

---

## Part 3 — 📅 Suggested day map (from today, ~2 h each)

| Day | Do |
|-----|----|
| 1 | Step 1 (DataHub up + token + env) |
| 2 | Step 2 (round-trip; report any API mismatch to Claude) |
| 3 | Step 3 + Step 4 (public repo + deploy) |
| 4 | Step 5 (video) |
| 5 | Step 6 (submit) — **don’t wait for the deadline day** |
| spare | Step 7 bonus, re-record video, polish Devpost copy |

---

## Part 4 — 🎯 Why this wins (30-sec judge pitch)

> “REROUTE treats a supply chain as what it really is — a lineage graph — and
> makes DataHub its metadata backbone. The twin lives in DataHub (datasets,
> lineage, ownership, custom platform). When a node fails, a **deterministic**
> blast-radius engine walks the downstream lineage — no LLM guessing — the AI
> explains it with **every claim cited to a DataHub URN** plus a confidence
> score, and the decision is **written back** as an incident, tags, and
> documentation, so the graph stays truthful for the next person or agent.
> Reads the graph. Decides with math. Contributes knowledge back.”

Criteria mapping: **Use of DataHub** = read + write + custom platform ·
**Technical execution** = deterministic engine + 52 tests · **Originality** =
autonomous triage/reroute layer DataHub doesn’t have · **Usefulness** = real
supply-chain incident response · **Quality** = live URL + examples/ + video.
