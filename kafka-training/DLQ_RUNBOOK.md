# DLQ Runbook — Contract Ingestion Consumer

**Service:** Contract Store → Data Marketplace ingestion consumer (Quarkus / SmallRye)
**Main topic:** `contract-events`  ·  **Dead-letter topic:** `contract-events-dlt`
**Owner:** Data Marketplace team  ·  **On-call:** <team rota>

> A message in the DLT is **work to do**, not a log line. Triage it, decide, act, and fix
> the root cause. Nothing in the DLT should sit untouched past the triage SLA.

---

## 0. When this runbook fires
- Alert: **DLT message count > 0** or **DLT arrival rate rising** (governance stream is
  low-volume, so any DLT message is worth looking at).
- Source of alert: <Prometheus/Grafana alert name> → <PagerDuty/Slack channel>.
- **Triage SLA:** <e.g. within 1 business hour> ·  **Retention on DLT:** <e.g. 14 days> —
  triage before messages expire.

## 1. Prerequisites / access
- [ ] Confluent Control Centre (C3) access for the environment — <C3 URL>
- [ ] Read access to `contract-events-dlt`; RBAC to produce to `contract-events` (for replay)
- [ ] Splunk access — <dashboard/query link>
- [ ] Metrics dashboard — <Grafana link>
- [ ] Replay tool / admin endpoint — <link or command>

## 2. Triage — find out WHY and WHICH
1. Open the DLT (`contract-events-dlt`) in **C3 / Kafka UI**, or query Splunk for the
   consumer's DLT logs (filter by correlation ID).
2. For each failed record, read the **diagnostic headers**:
   - `dead-letter-reason` — the failure message
   - `dead-letter-cause` — underlying cause
   - `dead-letter-topic` / `-partition` / `-offset` — where it came from
   - `correlationId` / event id — trace it end-to-end
3. **Classify** the cause (drives the next step):

| Signal in `dead-letter-reason` | Likely cause | Category |
|---|---|---|
| Timeout / 5xx / connection to v5 API | dependency was down longer than retries | **Transient** |
| DB / connection / transaction error | DB blip | **Transient** |
| Validation / mandatory field / lifecycle | invalid data | **Permanent (data)** |
| Deserialization / schema | schema mismatch | **Permanent (schema)** |
| NullPointer / unexpected app error | our bug (valid event wrongly failed) | **Our bug** |
| Security / ambiguous | needs a human call | **Escalate** |

## 3. Decision — what to do

```
                 ┌─ Transient (dependency recovered) ───────► REPLAY (§4)
                 │
 classify cause ─┼─ Our bug / schema ─► fix code → deploy → REPLAY (§4)
                 │
                 ├─ Bad data (permanent) ─► cannot replay → ask Helios to re-emit,
                 │                           else QUARANTINE (§5)
                 │
                 └─ Security / ambiguous ─► ESCALATE (§6)
```

## 4. Replay procedure
**Goal:** re-publish the DLT record(s) back onto `contract-events` so the pipeline
reprocesses them. **Idempotency makes replay safe** (no duplicates).

1. Confirm the **root cause is resolved** (dependency healthy / fix deployed). Do **not**
   replay into a still-broken pipeline — it loops straight back to the DLT.
2. Run the replay tool / admin endpoint:
   ```
   <replay command / POST /admin/dlq/replay?topic=contract-events-dlt&max=N>
   ```
3. The replay tool MUST:
   - preserve the original **key** and **headers**
   - **increment a `replay-attempt` header**
   - **stop after N replays** (see loop guard below) and move the record to quarantine
4. Watch: DLT count drops, main-topic consumer processes them, **consumer lag returns to 0**,
   rows appear in the Marketplace.

⚠️ **Loop guard (mandatory):** a replayed message that fails again returns to the DLT.
- Cap replays at **N = <e.g. 3>** using the `replay-attempt` header.
- After N, route to **quarantine** (§5) and raise for investigation. Never blind-loop.

## 5. Quarantine (genuinely dead messages)
For records that can't be fixed by replay (bad data, exhausted replays):
1. Move to the **quarantine** destination — <quarantine topic / GCS bucket / table>.
2. Record: correlation ID, contract ID/version, `dead-letter-reason`, decision, who/when.
3. Nothing is silently dropped — quarantine keeps an **audit trail**.
4. If the data is genuinely wrong at source, raise with **Helios** to correct & re-emit.

## 6. Escalation
- Security-sensitive or ambiguous cases → <security/lead contact>.
- Sustained DLT growth / suspected incident → raise an incident per <incident process>,
  page <on-call>.
- Cross-team root cause (Helios producing bad events, schema change) → <Helios contact>.

## 7. Prevent recurrence
- Every DLT message = a gap. Raise a ticket to fix the **root cause** (missing validation,
  unhandled case, flaky dependency, schema-compat gap) so it stops recurring.
- Repeated same-cause DLT entries → fix the code, don't keep replaying.

## 8. Incident record (fill in per occurrence)
| Field | Value |
|---|---|
| Date / time | |
| Correlation ID(s) / contract ID(s) | |
| `dead-letter-reason` | |
| Category | transient / data / schema / bug / escalate |
| Action taken | replay / fix+replay / quarantine / escalate |
| Replayed count / outcome | |
| Root-cause ticket | |
| Resolved by / when | |

---

## Quick reference
| Thing | Value |
|---|---|
| Main topic | `contract-events` |
| DLT | `contract-events-dlt` |
| Quarantine | `<quarantine topic / store>` |
| Replay cap (N) | `<3>` |
| Triage SLA | `<1 business hour>` |
| DLT retention | `<14 days>` |
| C3 / Kafka UI | `<url>` |
| Splunk dashboard | `<url>` |
| Metrics dashboard | `<url>` |
| On-call | `<rota>` |

> Replace every `<…>` placeholder with the real environment values before publishing to the team.
> Contains internal project names (Helios, Collibra) — handle per LBG data-handling policy.
