# DataHub integration — sample outputs

Real artifacts produced by REROUTE's DataHub layer, generated from the built-in
demo semiconductor supply chain (`demo-semi-apac` — the same twin served live at
**`/demo`**, no login needed) by failing the **Port of Singapore** node. Every
file is the actual output of the pure functions in [`lib/datahub/`](../lib/datahub)
— nothing hand-written.

| File | What it is | Produced by |
|------|-----------|-------------|
| `01-emitted-aspects.json` | The `DatasetProperties` / `Ownership` / `UpstreamLineage` aspects REROUTE upserts into DataHub via `POST /openapi/entities/v1/` — the supply chain as a metadata graph. | `buildTwinAspects()` |
| `02-blast-radius.json` | Deterministic downstream blast radius: impacted nodes with hop distance + severity, and the owners to notify. | `blastRadius()` |
| `03-grounded-rationale.json` | Human-readable reasoning where **every claim cites a DataHub URN**, plus a confidence score and a needs-review flag. | `buildGroundedRationale()` |
| `04-impact-response.json` | The full `POST /api/datahub/impact` response, including the DataHub write-back state and the lineage cross-check. | impact route |
| `05-raise-incident.graphql.json` | The exact GraphQL `raiseIncident` mutation + variables REROUTE sends to write the incident back to DataHub. | `writeback.ts` |
| `06-reroute.json` | Deterministic weighted-Dijkstra reroute around the failed node — one segment recovers via the HK air-freight lane, one is severed. | `rerouteAroundNode()` |

## The flow

```
twin (Supabase or built-in demo)
  └─ buildTwinAspects ─▶ DataHub  (nodes as datasets + lineage + ownership + custom platform)
        blastRadius ───▶ deterministic downstream impact      (the math decides)
   rerouteAroundNode ──▶ deterministic alternate routes        (the math decides)
   buildGroundedRationale ─▶ URN-cited, confidence-scored reasoning (the AI explains)
        recordDisruption ─▶ DataHub  (incident + tags + documentation written back)
```
