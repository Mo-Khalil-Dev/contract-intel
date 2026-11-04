# EDPMARK-5145 — Spike Findings: Non-Production Kafka Stream Subscription

- Spike: EDPMARK-5145
- Target story: EDPMARK-4979 (Verify Non-Production Stream Subscription)
- Blocks: EDPMARK-5129 (scaffold consumer + CI/CD), EDPMARK-5130 (configure listener/broker), EDPMARK-5131
- Author: Mohamed Khalil
- Date: (to add)
- Status: Draft findings

Spike output: documented findings and recommended approach, the requests to raise (with owners and lead times), the recommended consumer configuration and production-isolation approach, delivery-task impacts, and open risks. Items under "To confirm" need a named owner's input before delivery.

---

## TL;DR — recommended approach

- Framework: Quarkus with SmallRye Reactive Messaging (Kafka), aligned with the DMP "Golden Path" Quarkus services.
- Subscription model: consume contract change events in non-prod (INT/PRE), then fetch the full contract from the Contract Store v5 API, validate, transform, and idempotent upsert.
- Resilience: manual ack (commit after success), bounded reconnect/backoff, and @Retry with exponential backoff feeding the DLQ on exhaustion; idempotent upsert.
- Isolation: per-environment cluster/tenant, service identity, RBAC, certificates and config, so non-prod cannot reach prod.
- Biggest unknowns to close: exact non-prod topic, partition count and retention; auth mechanism and cert rotation; Avro vs JSON and schema registry; and how test events get published to non-prod.

---

## Findings by investigation area

Ordered by priority; each heading keeps the spike's original area number (1–8) for traceability.

### 1. KaaS tenancy and topics

Onboarding and promotion:

- Kafka onboarding is owned by Hari — it creates and configures our own service topics in our KaaS tenant, starting in INT, then promoted to PRE and PROD.
- Per-environment connection details are provided as each environment's onboarding completes.

Per-environment configuration:

- Built from the LBG Java Quarkus Golden Path template, which ships per-environment (and per-cloud) YAML files (for example `values-int/pre/prod.yaml`, `application-<env>.yaml`, and the `.harness/` pipeline/service YAMLs) controlling the config and environment variables per environment (INT/PRE/PROD).
- Once each environment's details are known, they are keyed into these YAMLs. This template-driven, pre-determined config guarantees the deployment targets the correct environment.

How config and secrets reach the container:

- Non-secret config (bootstrap servers, topic names, consumer group, flags) goes directly in the per-env YAML (stored in Git).
- Secrets (keystore/truststore passwords, tokens, certs) are held in the YAML only as a reference to Vault (path or secret name), never as the raw value (YAMLs are in Git).
- The actual secret values live in the Terraform-provisioned Vault, per environment (some auto-issued, for example JKS certs).
- At deploy/container-creation, Harness picks the right environment's YAML, resolves the secret references from Vault, and injects both config and secrets into the pod. Nothing is in the image, code, or logs.

Topics — two per environment:

- Contract store events topic: our own topic receiving events from the Helios topic via bridging/replication; its partition count matches the Helios source to preserve ordering.
- Dead-letter topic (DLT): one partition, plus notification/alerting when a message is dispatched there.

Local development:

- A local containerized Kafka stack (Dockerfile) is already built, independent of the KaaS environments.

Assumption:

- Topic replication is provided and operated as part of KaaS onboarding (Helios source to our contract-events topic), not built or operated by our team. This keeps replication out of our delivery scope; we only consume our own topic. Validate with Hari/KaaS. If false, replication setup/operation becomes a new delivery task and a schedule risk.

To confirm (owner: Hari / KaaS):

- Exact topic names per environment.
- Confirm replication is managed by onboarding (mechanism and who supports it if it stalls).
- That it preserves the Helios partition count.
- Retention on both topics (recovery/replay window).
- How replication lag is monitored.
- Per-environment cluster/bootstrap details (on onboarding completion).

### 4. Production isolation

Enforced by defence-in-depth across four independent controls, so the non-prod consumer cannot reach production topics or commit production offsets:

- Environment-specific config (Golden Path): per-env config files/scripts set distinct bootstrap servers, topic names and environment variables for INT/PRE/PROD. A non-prod deployment holds no production bootstrap address, so there is no route to prod brokers.
- Separate credentials per environment (Terraform Vault): each environment has its own service identity/certs in the per-env Vault; non-prod credentials authenticate only to the non-prod cluster and are invalid on prod.
- RBAC scoping: the non-prod service account has READ on the non-prod topic/group and PRODUCE on the non-prod DLT only, with no role bindings on production. Even on misconfiguration it could not read prod data or commit prod offsets.
- Environment-specific consumer groups: each environment uses its own consumer group, set by the environment-specific config. The consumer only reads from, and records how far it has processed against, the non-prod cluster it is connected to. It has no connection or identity in production, so it cannot read production data or affect production in any way.
- Pipeline enforcement: Harness/Backstage injects the correct per-env config and secrets; promotion is INT to PRE to PROD, with each environment applying its own config.

Net: wrong address (config), wrong credentials (Vault), no permissions (RBAC), and its own environment-scoped consumer group. Any one prevents cross-environment access; together they guarantee isolation.

To confirm / agree with team:

- Non-prod credentials and RBAC are explicitly scoped with zero production access (KaaS/security).
- The Golden Path per-env config has no shared/default pointing to prod, and promotion gating is understood.
- The isolation approach is reviewed and signed off (acceptance criterion).

### 2. Identity and credentials

Finding: these are predominantly KaaS-platform / onboarding concerns. The authentication model, service identity, certificate issuance, rotation/expiry and RBAC model are determined by how the KaaS platform is built and delivered to us via onboarding (owned by Hari). Our job is to obtain these from the KaaS team and apply them in our Golden Path config and Vault, not to design them. (Quarkus supports all Kafka auth, mTLS and SASL, so whichever mechanism KaaS mandates is a config change, not code; mTLS is most likely given the JKS references.)

Owned by KaaS / onboarding — we obtain the values (confirm with KaaS / Hari, per environment):

- Authentication mechanism (mTLS vs SASL).
- Dedicated service identity / service account per environment.
- Certificate / JKS keystore and truststore issuance.
- Certificate / credential rotation and expiry process.
- RBAC model and specific role bindings (we raise the request; KaaS grants): READ on topic and consumer group, PRODUCE on our DLT.

Owned by us (small — apply, not design):

- Consumer group name (`data-marketplace-subscriber`), within any KaaS/LBG naming convention.
- Key the obtained connection/auth values into the Golden Path per-env config.
- Populate and handle secrets in the Terraform Vault; no credentials in logs.
- Ensure the consumer handles secret/cert refresh (reconnect on rotation) so a renewal does not cause an outage.

Net: point 2 is largely a dependency on KaaS onboarding (obtain and apply), not a design task.

### 3. Network connectivity

- GKE region is europe-west2; egress to non-prod brokers is established via the KaaS connectivity pipeline (firewall rules) from onboarding.

To confirm (network / KaaS):

- Non-prod broker hostnames/ports (likely TLS 9093).
- Required firewall rules / network requests.
- DNS resolution.
- Lead times.

### 5. Event contract

Finding: we will consume events using the same schema that Helios / Contract Store dispatches — we adopt the producer's event contract rather than defining our own. Helios owns the contract; we conform to it as the consumer, which avoids schema duplication and drift. Serialisation will match Helios (likely Avro with a Schema Registry; Confluent is indicated by the `confluent-proxy` Nexus repo).

Our work:

- Obtain Helios's schema from the schema registry (plus sample events).
- Generate our model and deserialiser from that schema (for Avro, generated classes) and validate inbound events against it.
- Reposition the schema tickets (4978/4991/4992) toward consuming/documenting Helios's schema, not authoring a separate one.

To confirm (Helios):

- The schema definition and where to get it (registry URL and subject, per environment).
- Avro vs JSON.
- Envelope fields, including a correlation/event id and the meaning of `version` (contract version).
- The compatibility policy and how schema changes are communicated to us (the Producer–Consumer Alignment and Schema Sign-off with Helios).

### 6. Test event publishing

Options:

- Helios produces events to the non-prod topic (preferred for true end-to-end).
- We obtain producer access to publish schema-valid test events.
- Local Dev Services and a simulator for developer-only testing.

To confirm (Helios / KaaS):

- Who can publish test events to the non-prod topic, the tooling, producer access, and owning team.

### 7. Consumer framework and resilience

This is our design decision, not a KaaS dependency. The spike's three asks:

- Client approach: SmallRye Reactive Messaging (Kafka). Higher-level and declarative (@Incoming); provides DLQ (failure-strategy), ack control and health out of the box; matches the Golden Path. Native client only if platform-mandated (no upside here).
- Bounded reconnect and backoff: `reconnect-attempts` and `reconnect-interval` so a lost connection retries a limited number of times with a wait, then fails fast and alerts rather than looping forever.
- Auth-failure alerting and observability: health (`/q/health`) reflects the Kafka connection (a persistent auth failure makes the pod unready); metrics (connection status and error counters, `/q/metrics`); structured logs with correlation id to Splunk; alert on repeated auth/connection failure to Dynatrace/PagerDuty/Teams. This pairs with cert rotation/expiry (point 2) so an expired cert pages someone rather than failing silently.

Message-processing resilience:

- Manual ack after success (commit after processing).
- @Retry with @ExponentialBackoff (transient-only via `retryOn`/`abortOn`): waits grow (for example 1s, 2s, 4s, 8s, capped); when `maxRetries` is exhausted the message is nacked and sent to the DLQ (failure-strategy=dead-letter-queue). Permanent failures use `abortOn` and go straight to the DLQ.
- In-process retries hold the partition, so keep total retry time (`maxDuration`) under `max.poll.interval.ms`; use a non-blocking retry-topic only if long backoff is ever needed.
- Idempotent upsert keyed by contractId (with a version guard), safe because retries/redelivery reprocess.
- @Blocking on the consumer (the v5 call and JDBC upsert are blocking).

To confirm:

- Any platform standard mandating native vs SmallRye.
- Alerting thresholds and channels (Dynatrace vs Prometheus; PagerDuty vs Teams).

### 8. Dependencies and contacts

| Area | Team / owner | Needed for | Lead time |
|---|---|---|---|
| KaaS / platform | KaaS team (via Front Door) | tenant, topics, RBAC, certs | (to add) |
| Contract Store / events | Helios (contact to add) | topic, schema, sample and test events | (to add) |
| Network / firewall | Network team | egress rules, DNS, ports | (to add) |
| CI/CD | Jenkins/Harness owner (HG) | pipelines, deploy | (to add) |
| Security / secrets | Security | Vault, cert issuance/rotation | (to add) |

---

## Acceptance-criteria outputs

### A. Requests to raise (owners and lead times)

| # | Request | Owner | Status | Lead time |
|---|---|---|---|---|
| 1 | Confirm non-prod cluster, source topic, partitions, retention; provision if needed | Helios / KaaS | Open | (to add) |
| 2 | RBAC: READ source topic and group; PRODUCE our DLT | KaaS | Open | (to add) |
| 3 | Service account and cert (JKS) issuance per env and rotation process | KaaS / security | Open | (to add) |
| 4 | Firewall/egress rules GKE (europe-west2) to non-prod brokers; DNS/ports | Network / KaaS | Open | (to add) |
| 5 | Secret injection into GKE (Vault/Secret Manager) | Platform / security | Open | (to add) |
| 6 | Sample events, schema (Avro/JSON) and registry access | Helios | Open | (to add) |
| 7 | Test-event publishing route to non-prod topic | Helios / KaaS | Open | (to add) |

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

Plus: manual ack (commit after success); @Retry with exponential backoff (transient-only) feeding the DLQ; idempotent upsert keyed by contractId (with version guard).

### C. Production-isolation approach

Per-environment cluster/tenant, service identity, RBAC scope, certs, Quarkus profile config and consumer group; secrets per environment from Vault; the deploy pipeline enforces it; non-prod credentials have no prod RBAC and cannot resolve or reach prod brokers.

### D. Delivery-task impacts (EDPMARK-4979)

- 5129 (scaffold and CI/CD): scaffold from the Quarkus Golden Path (`dmp-producer-service`); add `quarkus-messaging-kafka` and the Avro/registry dependency; add a `messaging/` package.
- 5130 (listener and broker properties): use the recommended SmallRye config above; blocked until the auth mechanism, topic and schema are confirmed.
- 5131: refine once findings are confirmed.
- Consider new tasks: Avro serde and schema registry wiring; DLQ and replay runbook; correlation-id/observability.

### E. Risks and blockers

- Delivery (5129–5131) is blocked until the topic/partition, auth mechanism, and schema/registry are confirmed.
- No existing DMP service consumes Kafka, so we are first; there is no internal reference for the messaging wiring (the Golden Path covers the rest).
- Cross-team lead times (Helios, network, KaaS) are unknown, which is a schedule risk.
- The bridged design adds a replication hop (extra lag and a second lag to monitor).
- The cert/secret rotation process must be confirmed to avoid auth-failure outages.

---

## Reference material (this spike's supporting notes)

- `STACK_AND_CONVENTIONS.md` — Quarkus Golden Path stack and layout.
- `KAFKA_EVENT_HANDLING_NOTES.md` — partitions, DLQ, problem catalogue, SmallRye cheat-sheet.
- `SCENARIOS.md` — consumer scenario/test matrix.
- `DLQ_RUNBOOK.md` — dead-letter operations.

Fill every placeholder in angle brackets and resolve each "To confirm" item with the named owner, then publish to Confluence and link to EDPMARK-5145 and EDPMARK-4979. Contains internal project names (Helios, Collibra, dmp-*) — handle per LBG data-handling policy.
