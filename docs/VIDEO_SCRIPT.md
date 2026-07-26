# REROUTE — Interactive Demo Video Script (~5:00)

A hands-on, live-driven walkthrough. Every beat is **you clicking the real
product** and it responding — not slides. Targets the rubric: **Problem · Solution
Demo · Technical Explanation**, and shows depth for Innovation, Complexity, UX, and Scale.

**Format tips (what makes it feel interactive):**
- Split-screen: your webcam bubble (bottom-right) + the live app. Talk *to* the viewer.
- Move the cursor deliberately; use click-highlight / a spotlight so viewers follow the action.
- Show **real-time responses**: the graph appearing, the alert opening, the reroute computing, a Supabase row updating live.
- Keep a second tab with the **terminal** (`pnpm test`) and one with the **Supabase Table Editor** to prove it's real, not mocked.
- Narrate decisions ("watch this number") to create little payoff moments.

Legend below: **🎬 ON SCREEN** = what to do · **🎙 SAY** = voiceover.

---

## 1 · Hook & the problem — 0:00–0:40
**🎬** Open on the landing page; slow-scroll to the big **73%** stat.
**🎙** "Quick question — how does a supply-chain team usually find out a port just closed or a supplier failed? From the *news*. **73% of disruptions are caught after the damage is done**, and then it's a scramble across spreadsheets and phone calls. I built **REROUTE** — *Risk Evaluation & Route Optimization Using Twin Emulation* — to flip that: see every risk, and **act on it**, before it becomes a crisis. Let me show you — live."

## 2 · 30-second overview — 0:40–1:10
**🎬** Click **Get Started** → land on the Dashboard. Sweep the cursor across the sidebar (Dashboard · Digital Twin · Simulation) and the live notification feed.
**🎙** "Three things happen here. You **model** your supply chain as a living digital twin. Autonomous AI agents **sense** threats from global news and weather. And you **act** — reroute, mitigate, resolve — from one screen. The trick is: the AI *explains*, but the *math* is deterministic and auditable. Let's build a real network first."

## 3 · Model it — import real data — 1:10–1:55
**🎬** Digital Twin → **Import CSV**. Drag in `demo-nodes.csv` and `demo-edges.csv`. Pause on the **preview**: "9 nodes, 9 edges, 0 errors." Click **Import & open**.
**🎙** "You can draw your network by hand — or import it. I'll drop in a real global chain as CSV… it validates every row, maps the columns, and — there it is. Nine nodes, nine routes, zero errors. **Import and open.**" *(graph animates in)* "That just saved to our database, live."
**🎬 (interactive proof)** Flip to the Supabase tab → refresh `supply_chains` / `nodes` → show the rows that just appeared.
**🎙** "Not a mock — those rows are really in Supabase, scoped to my account with row-level security."

## 4 · The living twin + the true map — 1:55–2:30
**🎬** Back on the canvas: hover a couple of nodes (supplier, port, retailer) — point out type colors and the risk-red retailer. Then hit the **Digital Twin ⇄ Map** toggle → the Map view.
**🎙** "Every node's color-coded by type and risk. This retailer's already flagged high-risk. Now watch — flip to the map… and it's the **same real network** on a world map. Shanghai, Singapore, Rotterdam, New York — *your* nodes, *your* routes. No fake data — if a node has no coordinates, it says so honestly instead of inventing one."

## 5 · Autonomous, GROUNDED intelligence — 2:30–3:15
**🎬** Back to Dashboard. Open a **HIGH** threat alert → **View Details**. Slowly point at the **AI-confidence badge**, the **sources**, and the **severity**.
**🎙** "In the background, agents scan news and weather and tie threats to *specific* nodes — here, a semiconductor supplier. But here's what I care about most: this alert is **grounded**. It shows a **confidence score**, its **sources**, and if it's shaky, a **'needs review'** flag. No black box — the AI tells you how much to trust it. That's the difference between a demo and something an ops team would actually run."

## 6 · Close the loop — REROUTE (the money shot) — 3:15–4:05
**🎬** In the same modal, click **Reroute around this node**. Let it compute. Read the top alternate out loud, pointing at the **+cost / +days**.
**🎙** "Now the important part — I act, right here. **Reroute around this node.** And this is *not* the AI guessing a path — it's a real **Dijkstra shortest-path** over the actual graph. It finds the bypass and tells me the exact trade-off: this alternate adds **nine hundred dollars and four days**. If a segment has *no* viable bypass, it says so in red — honesty over hallucination."
**🎬 (interactive)** Point at a red "no bypass" row if present; hover the cost/time.
**🎙** "That number is computed, not invented — and I can show you the unit tests that prove it in a second."

## 7 · Mitigate & resolve — the worklist — 4:05–4:35
**🎬** Click **Generate mitigation** → the AI plan appears (immediate / short-term / long-term with owners). Then **Save plan & mark in progress**. Then **Acknowledge**, add an owner (**Assign to me**), and **Resolve**.
**🎙** "Need a plan? **Generate mitigation** — the AI writes a concrete, step-by-step response with owners and timeframes. I save it, assign myself, and move it through acknowledge → in-progress → resolved. **Detect, decide, act — one modal, full audit trail.**"
**🎬 (interactive proof)** Flip to Supabase `alert_actions` → show the rows appearing for each action.

## 8 · Depth — simulation / chaos (quick) — 4:35–4:50
**🎬** Simulation tab → run a quick disruption / show the cascading-failure view or a Monte-Carlo result.
**🎙** "And before a disruption ever happens, you can stress-test — inject a failure and watch it cascade across the network with Monte-Carlo simulation."

## 9 · Tech, tests & scale — the closer — 4:50–5:00
**🎬** Quick cuts: terminal `pnpm test` → **23 passing**; the **ARCHITECTURE.md** diagram; the **live Cloud Run URL** in the browser bar.
**🎙** "Under the hood: Next.js, **13 Google-ADK agents on Gemini**, Supabase with row-level security, and a **deterministic, unit-tested core** — twenty-three tests green. It's stateless, deployed on **Google Cloud Run**, autoscaling to zero. **REROUTE — know every risk, and act on it, before it becomes a crisis.** Thanks for watching."

---

### 🎯 Shot checklist (tick while recording)
- [ ] Landing hero + **73%**
- [ ] CSV import → preview (9/9, 0 errors) → twin opens
- [ ] **Supabase rows** appear (proof it's real)
- [ ] Digital Twin ⇄ **Map** (same real network)
- [ ] Threat alert → **grounding badge** (confidence + sources)
- [ ] **Reroute** with real **+cost/+days** (and a red "no bypass" if available)
- [ ] **Generate mitigation** → save → **Acknowledge → Resolve**
- [ ] `alert_actions` rows appear in Supabase
- [ ] Simulation / cascade (quick)
- [ ] `pnpm test` = **23 passed** + architecture diagram + **live URL**

### 🗣 Reusable one-liners
- "The AI explains; the math decides."
- "Grounded, not guessed."
- "Honesty over hallucination — if there's no bypass, it says so."
- "Detect → decide → act, in one screen."

### ⏱ Pacing
Rehearse once end-to-end; aim to finish the *actions* by 4:50 so the tech closer lands clean. If you run long, trim Section 8 (simulation) first — it's the optional depth beat.

### 🧰 Pre-record setup
- Seed a **HIGH** alert tied to a real node (so Reroute has data). Import the demo twin first so the agents have a network to scan.
- Have `.env` set with a working `GOOGLE_API_KEY` (for the mitigation call) — or pre-generate one so it's instant on camera.
- Two helper tabs ready: **terminal** (tests) + **Supabase Table Editor**.
- Zoom the browser to ~110–125% so text is readable in the recording.
