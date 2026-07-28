# DataHub integration — sample outputs

Real artifacts produced by REROUTE's DataHub layer, generated from a demo
semiconductor supply chain (`semi-apac`) by failing the **TSMC Wafer Fab
(Taiwan)** node. Every file is the actual output of the pure functions in
[`lib/datahub/`](../lib/datahub) — nothing hand-written.

| File | What it is | Produced by |
|------|-----------|-------------|
| `01-emitted-aspects.json` | The `DatasetProperties` / `Ownership` / `UpstreamLineage` aspects REROUTE upserts into DataHub via `POST /openapi/entities/v1/` — the supply chain as a metadata graph. | `buildTwinAspects()` |
| `02-blast-radius.json` | Deterministic downstream blast radius: impacted nodes with hop distance + severity, and the owners to notify. | `blastRadius()` |
| `03-grounded-rationale.json` | Human-readable reasoning where **every claim cites a DataHub URN**, plus a confidence score and a needs-review flag. | `buildGroundedRationale()` |
| `04-impact-response.json` | The full `POST /api/datahub/impact` response, including the DataHub write-back state and the lineage cross-check. | impact route |
| `05-raise-incident.graphql.json` | The exact GraphQL `raiseIncident` mutation + variables REROUTE sends to write the incident back to DataHub. | `writeback.ts` |

## The flow

```
twin (Supabase)
  └─ buildTwinAspects ─▶ DataHub  (nodes as datasets + lineage + ownership)
        blastRadius ───▶ deterministic downstream impact (the math decides)
   buildGroundedRationale ─▶ cited, confidence-scored reasoning (the AI explains)
        recordDisruption ─▶ DataHub  (incident + tags + documentation written back)
```
