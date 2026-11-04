# EDPMARK-5145 — Spike Findings: Non-Production Kafka Stream Subscription

**Spike:** EDPMARK-5145 · **Target story:** EDPMARK-4979 (Verify Non-Production Stream Subscription)
**Blocks:** EDPMARK-5129 (scaffold consumer + CI/CD), EDPMARK-5130 (configure listener/broker), EDPMARK-5131
**Author:** Mohamed Khalil · **Date:** <date> · **Status:** Draft findings

> Spike output: documented findings + recommended approach, the requests to raise (with owners
> & lead times), the recommended consumer config + production-isolation approach, delivery-task
> impacts, and open risks. Items marked **TO CONFIRM** need a named owner's input before delivery.

Legend: ✅ recommendation/position · ❓ **TO CONFIRM** (owner) · ⛔ blocker/risk

---

## TL;DR — recommended approach
- **Framework:** Quarkus + **SmallRye Reactive Messaging (Kafka)** — aligns with the DMP "Golden Path" Quarkus services. ✅
- **Subscription model:** consume contract change events in **non-prod (INT/PRE)**, then fetch the full contract from the Contract Store v5 API, validate, transform, idempotent upsert. ✅
- **Resilience:** manual ack (commit after success), bounded reconnect/backoff, `@Retry` (fixed backoff v1) → **DLQ** on exhaustion; idempotent upsert. ✅
- **Isolation:** per-environment cluster/tenant, service identity, RBAC, certs and config — non-prod cannot reach prod. ✅
- **Biggest unknowns to close:** exact non-prod topic + partition/retention, auth mechanism + cert/rotation, Avro-vs-JSON + schema registry, and how test events get published to non-prod. ❓

---

## Findings by investigation area

> Ordered by priority; each heading keeps the spike's original area number (1–8) for traceability.

### 1. KaaS tenancy & topics
**Onboarding & promotion:** Kafka onboarding is owned by **Hari** — creates/configures our own service topics in our KaaS tenant, starting in **INT**, then **promoted to PRE → PROD**. Per-environment connection details are provided as each env's onboarding completes.

**Per-environment configuration:** Built from the **LBG Java Quarkus Golden Path** template, which ships scripts/config files controlling the **env variables per environment (INT/PRE/PROD)**. Once each env's details are known they're keyed into these files — template-driven, pre-determined config guarantees the deployment targets the correct environment.

**Secrets:** A **Terraform-managed Vault** comes with the Golden Path; per-env secrets (creds/certs) stored there and injected at deploy time (none in code/logs).

**Topics — two per environment:**
- ✅ **Contract store events topic** — our own topic receiving events from the Helios topic via bridging/replication; **partition count matches the Helios source** (preserves ordering).
- ✅ **Dead-letter topic (DLT)** — **1 partition**; plus **notification/alerting when a message is dispatched there**.

**Local development:** ✅ Local containerized Kafka stack (**Dockerfile**) already built, independent of KaaS envs.

**Assumption 🅰️ — Topic replication is provided and operated as part of KaaS onboarding** (Helios source → our contract-events topic), **not built or operated by our team**. This keeps replication out of our delivery scope — we only consume our own topic. *Validate with Hari/KaaS; if false, replication setup/operation becomes a new delivery task and a schedule risk.*

- ❓ **TO CONFIRM (owner: Hari / KaaS):** exact **topic names** per env; confirm replication is **managed by onboarding** (mechanism + who supports it if it stalls); that it **preserves the Helios partition count**; **retention** on both topics (recovery/replay window); how **replication lag** is monitored; per-env **cluster/bootstrap details** (on onboarding completion).

### 4. Production isolation
Enforced by **defence-in-depth** across four independent controls, so the non-prod consumer cannot reach production topics or commit production offsets:

- ✅ **(a) Environment-specific config (Golden Path).** Per-env config files/scripts set distinct bootstrap servers, topic names and env variables for INT/PRE/PROD. A non-prod deployment holds **no production bootstrap address** → no route to prod brokers.
- ✅ **(b) Separate credentials per env (Terraform Vault).** Each env has its own service identity/certs in the per-env Vault; non-prod creds authenticate **only** to the non-prod cluster, invalid on prod.
- ✅ **(c) RBAC scoping.** Non-prod service account has READ on the **non-prod** topic/group and PRODUCE on the **non-prod** DLT only — **no role bindings on production**. Even on misconfig it couldn't read prod data or commit prod offsets.
- ✅ **(d) Environment-specific consumer groups.** Each environment uses its **own consumer group**, set by the environment-specific config. The consumer only reads from — and records how far it has processed against — the **non-prod** cluster it is connected to. It has no connection or identity in production, so it cannot read production data or affect production in any way.
- ✅ **Pipeline enforcement.** Harness/Backstage injects the correct per-env config+secrets; promotion is INT → PRE → PROD with each env applying its own config.

**Net:** wrong address (config) + wrong credentials (Vault) + no permissions (RBAC) + its own environment-scoped consumer group — any one prevents cross-env access; together they guarantee isolation.

- ❓ **TO CONFIRM / AGREE WITH TEAM:** non-prod creds + **RBAC explicitly scoped with zero production access** (KaaS/security); Golden Path per-env config has **no shared/default pointing to prod** + promotion gating understood; **isolation approach reviewed and signed off** (acceptance criterion).

### 2. Identity & credentials
**Finding:** these are **predominantly KaaS-platform / onboarding concerns** — the authentication model, service identity, certificate issuance, rotation/expiry and RBAC model are **determined by how the KaaS platform is built** and delivered to us via **onboarding (owned by Hari)**. Our job is to **obtain these from the KaaS team and apply them** in our Golden Path config and Vault — not to design them.

**Owned by KaaS / onboarding — we obtain the values (❓ confirm with KaaS / Hari, per env):**
- Authentication mechanism (**mTLS vs SASL**)
- Dedicated **service identity / service account** per environment
- **Certificate / JKS** keystore + truststore issuance
- Certificate / credential **rotation & expiry** process
- **RBAC** model + specific role bindings (we raise the request; KaaS grants): READ on topic + consumer group, PRODUCE on our DLT

**Owned by us (small — apply, don't design):**
- ✅ **Consumer group name** (`data-marketplace-subscriber`), within any KaaS/LBG naming convention
- ✅ Key the obtained connection/auth values into the **Golden Path per-env config**
- ✅ Populate/handle secrets in the **Terraform Vault**; **no credentials in logs**
- ✅ Ensure the consumer **handles secret/cert refresh** (reconnect on rotation) so a renewal doesn't cause an outage

➡️ **Net:** point 2 is largely a **dependency on KaaS onboarding** (obtain + apply), not a design task.

### 3. Network connectivity
- ✅ GKE region **europe-west2**; egress to non-prod brokers established via the KaaS **connectivity pipeline** (firewall rules) from onboarding.
- ❓ **TO CONFIRM (network / KaaS):** non-prod broker **hostnames/ports** (likely TLS 9093); required **firewall rules / network requests**; **DNS** resolution; **lead times**.

### 5. Event contract
- ✅ Envelope + payload schema are being defined (EDPMARK-4991/4992); serialisation likely **Avro + Schema Registry** (Confluent — `confluent-proxy` Nexus repo seen), confirm vs JSON Schema / Apicurio.
- ❓ **TO CONFIRM (Helios):** obtain **sample events**; envelope fields (incl. **correlation/event id** header); **Avro vs JSON**; **schema registry** type + URL per env; compatibility policy; deserialiser requirements.

### 6. Test event publishing
- ✅ Options: (a) **Helios produces** to the non-prod topic (preferred for true E2E); (b) we get **producer access** to publish schema-valid test events; (c) **local Dev Services + simulator** for dev-only.
- ❓ **TO CONFIRM (Helios / KaaS):** who can **publish test events** to the non-prod topic, tooling, producer access, owning team.

### 7. Consumer framework & resilience
- ✅ **SmallRye Reactive Messaging (Kafka)** recommended over the native client — higher-level, matches Golden Path, gives failure-strategy/DLQ, ack control, health.
- ✅ **Bounded reconnect/backoff**: configure `reconnect-attempts` / `reconnect-interval` so auth/connection failures don't loop unbounded; **fail-fast + alert** on auth failure.
- ✅ **Resilience:** manual ack (commit after success); `@Retry` (fixed backoff v1, transient-only) → **DLQ** (`failure-strategy=dead-letter-queue`); idempotent upsert.
- ✅ **Observability:** consumer lag, **auth-failure alerts**, DLQ metrics, structured JSON logs + **correlation id** (+ OpenTelemetry trace) via `/q/health`, `/q/metrics`.
- ❓ **TO CONFIRM:** any platform standard mandating native vs SmallRye; alerting/observability expectations (thresholds, channels).

### 8. Dependencies & contacts
| Area | Team / owner | Needed for | Lead time |
|---|---|---|---|
| KaaS / platform | <KaaS team> (via Front Door) | tenant, topics, RBAC, certs | <?> |
| Contract Store / events | **Helios** (<contact>) | topic, schema, sample + test events | <?> |
| Network / firewall | <network team> | egress rules, DNS, ports | <?> |
| CI/CD | <Jenkins/Harness owner> (HG) | pipelines, deploy | <?> |
| Security / secrets | <security> | Vault, cert issuance/rotation | <?> |

---

## Acceptance-criteria outputs

### A. Requests to raise (owners + lead times)
| # | Request | Owner | Status | Lead time |
|---|---|---|---|---|
| 1 | Confirm non-prod cluster, source topic, partitions, retention; provision if needed | Helios / KaaS | <open> | <?> |
| 2 | RBAC: READ source topic + group; PRODUCE our DLT | KaaS | <open> | <?> |
| 3 | Service account + cert (JKS) issuance per env + rotation process | KaaS / security | <open> | <?> |
| 4 | Firewall/egress rules GKE (europe-west2) → non-prod brokers; DNS/ports | Network / KaaS | <open> | <?> |
| 5 | Secret injection into GKE (Vault/Secret Manager) | Platform / security | <open> | <?> |
| 6 | Sample events + schema (Avro/JSON) + registry access | Helios | <open> | <?> |
| 7 | Test-event publishing route to non-prod topic | Helios / KaaS | <open> | <?> |

### B. Recommended consumer configuration (SmallRye, non-prod)
```properties
mp.messaging.incoming.contract-events.connector=smallrye-kafka
mp.messaging.incoming.contract-events.topic=<non-prod source/replicated topic>
mp.messaging.incoming.contract-events.group.id=data-marketplace-subscriber
mp.messaging.incoming.contract-events.auto.offset.reset=earliest
# security (confirm mTLS vs SASL)
mp.messaging.incoming.contract-events.security.protocol=SSL
mp.messaging.incoming.contract-events.ssl.truststore.location=<from Vault/secret>
mp.messaging.incoming.contract-events.ssl.keystore.location=<from Vault/secret>
# bounded reconnect
mp.messaging.incoming.contract-events.reconnect-attempts=<e.g. 10>
mp.messaging.incoming.contract-events.reconnect-interval=<e.g. 5>   # seconds
# DLQ
mp.messaging.incoming.contract-events.failure-strategy=dead-letter-queue
mp.messaging.incoming.contract-events.dead-letter-queue.topic=contract-events-dlt
```
Plus: manual ack (commit after success), `@Retry` fixed backoff (transient-only) → DLQ, idempotent upsert keyed by contractId (+version).

### C. Production-isolation approach
Per-environment **cluster/tenant + service identity + RBAC scope + certs + Quarkus profile config + consumer group**; secrets per env from Vault; deploy pipeline enforces; non-prod creds have **no** prod RBAC and cannot resolve/reach prod brokers.

### D. Delivery-task impacts (EDPMARK-4979)
- **5129 (scaffold + CI/CD):** scaffold from the **Quarkus Golden Path** (`dmp-producer-service`); add `quarkus-messaging-kafka` + Avro/registry dep; add a `messaging/` package.
- **5130 (listener + broker props):** use the recommended SmallRye config above; blocked until auth mechanism + topic + schema confirmed.
- **5131:** <refine once findings confirmed>.
- Consider new tasks: Avro serde + schema registry wiring; DLQ + replay runbook; correlation-id/observability.

### E. Risks & blockers
- ⛔ Delivery (5129–5131) **blocked** until: topic/partition, auth mechanism, and schema/registry are confirmed.
- ⛔ No existing DMP service consumes Kafka → **we are first**; no internal reference for the messaging wiring (Golden Path covers the rest).
- ⛔ Cross-team lead times (Helios, network, KaaS) unknown → schedule risk.
- ⚠️ Bridged design adds a **replication hop** (extra lag + a second lag to monitor).
- ⚠️ Cert/secret **rotation** process must be confirmed to avoid auth-failure outages.

---

## Reference material (this spike's supporting notes)
- `STACK_AND_CONVENTIONS.md` — Quarkus Golden Path stack + layout
- `KAFKA_EVENT_HANDLING_NOTES.md` — partitions, DLQ, problem catalogue, SmallRye cheat-sheet
- `SCENARIOS.md` — consumer scenario/test matrix
- `DLQ_RUNBOOK.md` — dead-letter operations
- (bridge/partition design notes)

> Fill every `<…>` and resolve each ❓ with the named owner, then publish to Confluence and link to EDPMARK-5145 and EDPMARK-4979.
> Contains internal project names (Helios, Collibra, dmp-*) — handle per LBG data-handling policy.
