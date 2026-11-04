# EDPMARK-5145 — Spike Findings: Non-Production Kafka Stream Subscription

- Spike: EDPMARK-5145
- Target story: EDPMARK-4979 (Verify Non-Production Stream Subscription)
- Blocks: EDPMARK-5129 (scaffold consumer + CI/CD), EDPMARK-5130 (configure listener/broker), EDPMARK-5131
- Author: Mohamed Khalil
- Date: (to add)
- Status: Draft findings

Spike output: documented findings and recommended approach, with the open items to confirm (by owner) before delivery. Items under "To confirm" need a named owner's input.

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

Finding: network connectivity is part of KaaS onboarding. The egress path from GKE (europe-west2) to the non-prod brokers — firewall rules, DNS and ports — is established by the KaaS connectivity pipeline during onboarding (owned by Hari), not built by our team. We consume it; the broker endpoints arrive with the per-environment onboarding details.

To confirm (owner: Hari / KaaS):

- Non-prod broker hostnames/ports (likely TLS 9093).
- That the connectivity pipeline covers our egress (firewall rules/DNS) with no separate network request needed from us.
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

Finding:

- Local: solved — we can dispatch events to our local Kafka stack (the Dockerfile stack plus a simulator/console producer).
- INT and PRE: unknown — needs exploration. Candidate approaches:
  - Manual produce via the Kafka UI / Confluent Control Centre in that environment. Requires produce access/permission; producing to the Helios-owned source topic would need Helios/KaaS permission, whereas producing to our own replicated topic bypasses the replication path.
  - Trigger a real contract change upstream — create a new contract, or update an existing one, in the Contract Store — so Helios emits a genuine event that flows through replication to our topic (true end-to-end; requires Contract Store / Helios access).

To confirm (Helios / KaaS):

- Whether manual produce via Kafka UI / C3 is available and permitted in INT/PRE, and on which topic.
- Whether and how we can trigger a real contract create/update from the upstream system, and who owns that.
- The preferred approach for the acceptance test (true end-to-end via upstream vs an injected test event).

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

---

## Failure handling, DLQ and observability

### Dead-letter queue (DLQ)

- Events that still fail after retries are routed to a dead-letter topic (DLT) by SmallRye (`failure-strategy=dead-letter-queue`), with no bespoke producer code.
- We will need a DLQ runbook (how to triage, replay, and quarantine dead-lettered events) and an observability/alerting setup (alert when a message lands on the DLT, and monitor DLT volume) so failures are visible and actioned, not silently accumulating.

### Why a DLQ (rather than building our own DB or UI)

- Reuses the Kafka platform we already have — no new infrastructure to build, secure, or operate.
- Native, standard pattern — supported by SmallRye out of the box; diagnostic headers (failure reason, original topic/partition/offset) are added automatically.
- Durable, ordered and replayable — a DLT is just a Kafka topic, so failed events can be reprocessed back onto the main topic (replay), inspected with existing Kafka tooling (Kafka UI / Confluent Control Centre), and retained per policy.
- A custom database or UI would mean building and maintaining extra storage, access control, and a console — duplicating what Kafka and its tooling already provide, at added cost and risk.
- Alerting integrates with the existing observability stack (Dynatrace/Prometheus, Splunk, PagerDuty/Teams) rather than a bespoke dashboard.

### Failure scenarios and resolutions

Delivery and ordering:

- Duplicate processing (at-least-once redelivery) — idempotent upsert keyed by contractId.
- Stale/old version overwrites newer (out-of-order via retry or replay) — version guard (update only if the incoming version is greater than or equal to the stored version).
- Message loss (offset committed before processing) — commit the offset after successful processing (manual ack; no auto-commit).

Downstream failures (v5 API / database):

- Transient failure (timeout, 5xx, DB blip) — @Retry with backoff, transient-only (`retryOn`).
- Permanent failure (bad data, 4xx, validation) — DLQ immediately (`abortOn`).
- Dependency outage (API down) — circuit breaker and timeout; alert; do not keep hammering it.
- 404 from v5 (contract not found) — short retry for a consistency race, then DLQ or treat as a delete (design decision to confirm).

Data and schema:

- Deserialization failure (bytes do not parse) — DLQ at the deserializer layer (cannot be retried).
- Schema evolution breaks the consumer — rely on Helios's schema registry, compatibility policy, and change notification; test old and new.
- Invalid or missing mandatory fields — validation, then DLQ.
