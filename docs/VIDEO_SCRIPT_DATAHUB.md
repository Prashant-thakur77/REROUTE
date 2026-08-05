# 🎬 REROUTE × DataHub — 3-Minute Demo Video Script

**Total runtime target: 2:50** (hard limit 3:00 — leave buffer).
**Setup before recording:**
- Two browser windows side by side: **left = localhost:3000/demo**, **right = DataHub UI** (localhost:9002), logged in, sitting on the *Port of Singapore* dataset page.
- In DataHub, **resolve/clean all old incidents** first so the Incidents tab starts empty or with one resolved row.
- Do one rehearsal run. Record 1080p. Speak calmly — the timings below have slack.

---

### [0:00–0:15] The hook — over the /demo page, before clicking anything
> "When a port shuts down or a supplier fails, supply-chain teams spend hours in war-rooms answering three questions: what's affected, who owns it, and what's the alternate route. REROUTE answers all three in seconds — and it does it on top of **DataHub**."

*(Screen: the demo lineage graph, cursor idle.)*

### [0:15–0:35] The idea — pan across the lineage graph, then flick to DataHub
> "Here's the insight: a supply chain **is** a lineage graph. So we made DataHub the metadata backbone. Every supplier, factory, port and warehouse is a **dataset** on a custom platform. Goods flows are **lineage**. Plant managers are **owners**. Risk and lead-time are **properties**. This isn't an export — DataHub is the source of truth, organized under a Supply-Chain **domain**."

*(Screen: hover 2–3 nodes on /demo, then 3 seconds on the DataHub dataset page showing platform, domain, owner, properties.)*

### [0:35–1:05] Break it — click Port of Singapore
> "Now watch what happens when the Port of Singapore goes down."
*(Click the node. Blast radius lights up.)*
> "Instantly: a deterministic **blast radius** — computed by graph traversal over the lineage, not by an AI guess. Four downstream nodes hit, weighted by business impact — distribution centers, then retail. And because ownership lives in DataHub, REROUTE already knows the four owners to notify."

*(Screen: point cursor at the heat-colored nodes, then the "Owners to notify" chips.)*

### [1:05–1:35] The reroute — the namesake moment
> "Then the reroute. Weighted shortest-path around the failed node: the Malaysia-to-Dallas lane **recovers via the Hong Kong air hub** — costs $2,800 more, but arrives **sixteen days earlier**. The Rotterdam lane has no alternative — that's flagged severed, severity High. This is the call an operations team needs in the first five minutes of an incident, and the math is provable."

*(Screen: the Alternate routes panel — hover the green feasible row, then a red severed row.)*

### [1:35–2:00] Grounded reasoning — scroll the reasoning panel
> "Every sentence of the explanation is **grounded**: each claim cites the DataHub URN it came from, with a confidence score computed from lineage completeness — and if the graph is incomplete, REROUTE says so and asks for human review instead of bluffing. The AI explains; the math decides."

*(Screen: slowly scroll the cited claims; point at "Confidence 100%".)*

### [2:00–2:35] The write-back — THE WINNING SHOT (split-screen moment)
> "And here's the part that makes this an agent that does real work: REROUTE **writes its knowledge back**. Watch the DataHub side."
*(Refresh the DataHub incidents tab.)*
> "A real **incident** — with the full grounded rationale. The impacted assets are **tagged**. DataHub's own health banner now warns every downstream consumer that upstreams are unhealthy. Nothing about this is a mock — the next engineer, or the next agent, inherits everything."

*(Screen: the new incident row → click it to show the rationale text → the `reroute-at-risk` tag → the "Some upstreams are unhealthy" banner.)*

### [2:35–2:50] Close the loop + sign-off
*(Back on /demo: click "Reroute actioned — resolve incident". Flip to DataHub: the incident shows Resolved.)*
> "When the operator actions the reroute, the incident is resolved — from REROUTE, reflected in DataHub. Full lifecycle. REROUTE: reads the DataHub graph, decides with deterministic math, and writes the knowledge back. Try it yourself — the demo needs no login. Thanks for watching."

*(End card / final frame: the live URL + repo URL on screen — put them in the video description too.)*

---

## Why this script wins on the rubric
| Beat | Criterion it scores |
|------|---------------------|
| 0:15 "DataHub is the source of truth… domain, owners, lineage" | **Use of DataHub** (read) |
| 0:35 deterministic blast radius | **Technical execution** |
| 1:05 reroute with cost/time trade-off | **Real-world usefulness** + originality |
| 1:35 URN-cited claims + confidence | **Originality** (beyond built-in features) |
| 2:00 incident + tags + health banner | **Use of DataHub** (write-back — their favorite) |
| 2:35 resolve lifecycle + "no login" | **Submission quality** (judges can verify) |

## Recording tips
- **One take is fine.** If you fumble, keep rolling — cut in any free editor (even YouTube's trim).
- Mouse movements slow and deliberate; pause 1s on anything you name.
- If English narration feels rushed, record screen first, voice-over after.
- Upload as **YouTube unlisted**, title: *"REROUTE — Supply-Chain Incident Response on the DataHub Graph (Demo)"*.
- Put the live URL, repo URL, and a timestamp list in the video description.
