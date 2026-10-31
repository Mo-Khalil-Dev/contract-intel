# Consumer Scenarios & Test Matrix

The situations the Contract Store → Marketplace ingestion consumer must handle.
Use it two ways:
1. **Drive your tests** — each row is a test case (unit, integration, or manual).
2. **Walk into a design review** — the ⚠️ **DECIDE** rows are open questions for your lead / Helios.

Status key: ✅ handled by current design · 🔨 pattern known, still to build · ⚠️ **DECIDE** (design decision needed)

---

## A. Happy path

| # | Scenario | Trigger | Expected behaviour | Status |
|---|----------|---------|--------------------|--------|
| 1 | New contract | `contract.created` event | fetch via v5 → insert row | ✅ |
| 2 | Updated contract | `contract.updated` event | fetch → upsert overwrites same row | ✅ |

## B. Delivery & ordering (Kafka realities)

| # | Scenario | Trigger | Expected behaviour | Status |
|---|----------|---------|--------------------|--------|
| 3 | Duplicate delivery | same event delivered twice (at-least-once) | idempotent upsert → exactly one row | ✅ |
| 4 | Stale/older version after newer | old version replayed after new processed | **do not overwrite newer data** — guard on version (`incoming >= stored`) | ⚠️ DECIDE / 🔨 |
| 5 | Restart / rebalance | pod killed, consumer group rebalances | resume from committed offset; reprocess uncommitted → idempotency | ✅ |
| 6 | Replay | offsets reset to reprocess history | safe to re-run (idempotent); documented runbook | 🔨 |

## C. Upstream failures — v5 API ("fetch the truth")

| # | Scenario | Trigger | Expected behaviour | Status |
|---|----------|---------|--------------------|--------|
| 7 | Transient API error | timeout / 5xx | retry with backoff, then DLQ if persistent | 🔨 (Resilience4j) |
| 8 | Contract not found (404) | event references missing contract | **short retry (consistency race) → then DLQ or treat as delete** | ⚠️ DECIDE |
| 9 | API outage | sustained failures | circuit breaker opens; don't ack → redeliver; lag grows → **alert** | 🔨 |
| 10 | API auth/cert expiry | credential/cert expires | calls fail → rotation handling | ⚠️ DECIDE (ops) |

## D. Data & validation

| # | Scenario | Trigger | Expected behaviour | Status |
|---|----------|---------|--------------------|--------|
| 11 | Malformed event | missing/invalid fields | validation fails → DLQ | ✅ |
| 12 | Deserialization failure | bytes don't parse to the schema | DLQ immediately (no retry) | ✅ |
| 13 | Invalid / ineligible contract | fails business rules / wrong lifecycle status | skip or DLQ per rules | ⚠️ DECIDE (define rules) |
| 14 | Schema evolution | Helios changes event shape | deserializer handles new + old (compatibility policy) | 🔨 (schema tickets) |
| 15 | Delete / tombstone event | `contract.deleted` (if it exists) | **remove from Marketplace?** current design only upserts | ⚠️ DECIDE |

## E. Downstream failures — database

| # | Scenario | Trigger | Expected behaviour | Status |
|---|----------|---------|--------------------|--------|
| 16 | DB down / blip | upsert fails | offset not committed → redeliver → retry | ✅ |
| 17 | Partial failure mid-pipeline | fetched+transformed, DB write fails | transaction + commit-after-success → no half-written state | ✅ (verify tx boundary) |
| 18 | Embedding service failure | embedding call fails | **fail+retry/DLQ, or store without embedding and backfill?** | ⚠️ DECIDE |

## F. Operational & scale

| # | Scenario | Trigger | Expected behaviour | Status |
|---|----------|---------|--------------------|--------|
| 19 | Event burst / backlog | high event volume | lag spikes → scale partitions + replicas | 🔨 (plan partition count) |
| 20 | Poison-message storm | many bad messages | DLQ fills; stream keeps flowing; **alert on DLQ growth** | 🔨 |
| 21 | Deployment / rolling restart | pod replaced | graceful shutdown: finish in-flight, commit, no loss | 🔨 (verify config) |
| 22 | DLQ reprocessing | bug fixed, need to retry dead letters | replay DLQ → reprocess | 🔨 (build/runbook) |
| 23 | Secret / cert rotation | JKS cert or API cred expires | rotate without downtime | ⚠️ DECIDE (ops) |
| 24 | No events in non-prod | Helios not producing in INT | use simulator / test topic | ✅ (practice project) |

---

## Open decisions to raise with lead / Helios

1. **Stale-version guard (#4):** last-write-wins by *version*, not by arrival order?
2. **404 handling (#8):** retry window before DLQ? Is a 404 ever a legitimate delete?
3. **Invalid/ineligible rules (#13):** what exactly makes a contract ineligible for the Marketplace?
4. **Delete semantics (#15):** is there a delete event, and should it remove the Marketplace record?
5. **Embedding-failure policy (#18):** hard-fail vs. graceful degrade + backfill?
6. **Rotation (#10, #23):** how are Kafka certs and API creds rotated in each environment?

---

## How to exercise these locally (practice project)

- **#3 Duplicate / idempotency:** publish the same event twice → `Total rows now: 1`.
- **#11/#12 Poison / DLQ:** publish an event with `"eventType":"POISON"` → retried → lands on `contract-events.DLT`.
- **#5 Redelivery:** add a delay before `ack`, kill the app mid-process, restart → event redelivered.
- **#16 DB failure:** stop the Postgres container mid-run → upserts fail, offset not committed → resumes when DB returns.
- **#19 Burst:** `POST /simulate/bulk?count=500` (once the simulator is added) → watch consumer lag in Kafka UI.

*The ✅ rows you can demonstrate today. The 🔨 rows are what the real service adds. The ⚠️ rows are conversations to have before coding them.*
