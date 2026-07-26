# REROUTE — Demo Video Script (~2:45)

Targets the rubric: **Problem Statement · Solution Demo · Technical Explanation.**
Record at 1080p, screen + voiceover. Keep energy up; show the product, not slides.

---

## 0:00–0:25 — Hook & problem
> "73% of supply-chain disruptions are found *after* the damage is done. A port
> closes, a supplier fails — and teams find out from the news, then scramble in
> spreadsheets. **REROUTE** — *Risk Evaluation & Route Optimization Using Twin
> Emulation* — turns that reactive scramble into a proactive, one-screen response."

*(Show the landing page scrolling — hero, the 73% stat.)*

## 0:25–0:45 — Model your network (real data in)
> "You start by modeling your supply chain as a living digital twin. You can draw
> it — or **import it**. Here's a real network from a CSV in seconds."

*(Digital Twin → Import CSV → upload `demo-nodes.csv` + `demo-edges.csv` → preview
shows 9 nodes / 9 edges, 0 errors → Import & open. The graph appears.)*

## 0:45–1:05 — See it as a live twin + map
> "It's a live twin — every node and route, color-coded by type and risk. Flip to
> the Map and it's the *same real network* on a world map — no fake data."

*(Toggle Digital Twin ⇄ Map. Show the real nodes plotted.)*

## 1:05–1:40 — Autonomous, GROUNDED intelligence
> "In the background, autonomous AI agents scan global news and weather and
> correlate threats to *specific* nodes. But here's the key: every alert is
> **grounded** — it shows a confidence score, its sources, and a 'needs review'
> flag. The AI explains; it never asks you to trust a black box."

*(Open a HIGH threat alert. Point at the AI-confidence badge + sources + severity.)*

## 1:40–2:15 — Close the loop: REROUTE (the money shot)
> "Now you act — from the same screen. Click **Reroute around this node**. This is
> *not* the AI guessing — it's a real Dijkstra shortest-path over your graph. It
> finds the alternate route and tells you the exact **added cost and added days**:
> Shenzhen → LA → Chicago, plus \$900, plus 4 days. If a segment has no bypass, it
> says so honestly."

*(Click Reroute → show the ranked alternates with cost/time. Then click **Generate
mitigation** → show the AI plan. Then **Acknowledge → Resolve**.)*

> "Generate an AI mitigation plan, assign an owner, and resolve — the whole
> detect → decide → act loop in one modal."

## 2:15–2:45 — Tech & scale (the closer)
> "Under the hood: Next.js and 13 Google-ADK agents on Gemini, Supabase with
> row-level security for multi-tenant data, and — critically — a **deterministic
> core**: routing and grounding are pure, unit-tested TypeScript, so the numbers
> are auditable, not hallucinated. It's stateless, deployed on **Google Cloud
> Run**, autoscaling to zero. **REROUTE: know every risk, and act on it, before it
> becomes a crisis.**"

*(Flash: the architecture diagram, `pnpm test` green (23 tests), the live Cloud Run URL.)*

---

### Shot checklist
- [ ] Landing hero + 73% stat
- [ ] CSV import → twin opens
- [ ] Digital Twin ⇄ Map toggle (real data)
- [ ] Threat alert modal: **grounding badge** (confidence + sources)
- [ ] **Reroute** with real cost/time deltas
- [ ] **Generate mitigation** + Acknowledge/Resolve
- [ ] `pnpm test` passing (23) + architecture diagram + live URL

### One-liners to reuse
- "The AI explains; the math decides."
- "Grounded, not guessed."
- "Detect → decide → act, in one screen."
