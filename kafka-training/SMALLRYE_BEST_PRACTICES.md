# SmallRye Reactive Messaging — Best Practices (Contract Ingestion Consumer)

Best practices for handling messages/events with **Quarkus + SmallRye Reactive Messaging (Kafka)**,
tuned to our scenario: consume contract change events → fetch the full contract from the v5 API →
validate → transform → idempotent upsert; failures route to a DLQ.

---

## 🔴 #1 — Use `@Blocking` for blocking work (the #1 SmallRye trap)

SmallRye runs the `@Incoming` method on the **Vert.x event-loop thread** by default. Our pipeline
does **blocking** work — the v5 **REST call** and the **Panache/JDBC upsert**. Running those on the
event loop blocks the whole reactive engine → throughput collapses.

```java
@Incoming("contract-events")
@Blocking                      // run on a worker thread, not the event loop
public void consume(ContractEventDto event) {
    service.process(event);    // v5 fetch + JDBC upsert are blocking -> OK on a worker
}
```
- `@Blocking` defaults to `ordered = true` → preserves per-partition order. **Keep it ordered** so
  same-contract events stay in sequence.
- `@Blocking(ordered = false)` is faster but **breaks ordering** — do NOT use for keyed contract events.
- Fully reactive (reactive REST client + Hibernate Reactive) is the alternative, but for the Golden
  Path (blocking Panache) `@Blocking` is the pragmatic, correct choice.

---

## Acknowledgment & offsets
- **Commit after success.** Payload method auto-acks after it returns; or use `Message.ack()` after
  the upsert for explicit control. Never ack before processing.
- Keep `commit-strategy=throttled` (default). **Never** enable `enable.auto.commit`.
- At-least-once delivery → **idempotency is mandatory**.

```properties
mp.messaging.incoming.contract-events.commit-strategy=throttled
mp.messaging.incoming.contract-events.enable.auto.commit=false
mp.messaging.incoming.contract-events.auto.offset.reset=earliest   # set deliberately per env
```

## Deserialization
- Use **Avro + Schema Registry** (confirm) with the matching deserializer.
- **Fail closed** on bad payloads: configure a deserialization-failure handler → **DLQ**; never let a
  bad byte array crash the consumer.

## Error handling & resilience
- **DLQ:** `failure-strategy=dead-letter-queue` + a named `dead-letter-queue.topic`.
- **Retry:** `@Retry` (fixed backoff v1) on the **service** method — **transient only** (`retryOn`),
  `abortOn` permanent → straight to DLQ. Requires `quarkus-smallrye-fault-tolerance`.
- **Circuit breaker + timeout** on the v5 client (`@CircuitBreaker`, `@Timeout`) — stop hammering a
  struggling dependency.
- **Bounded reconnect:** set `reconnect-attempts` / `reconnect-interval` so auth/connection failures
  don't loop forever; **alert** on auth failure.

```java
@Retry(maxRetries = 3, delay = 1000, delayUnit = ChronoUnit.MILLIS, jitter = 0,
       retryOn = TransientProcessingException.class,
       abortOn = InvalidEventException.class)
public void process(ContractEventDto event) { ... }
```

## Idempotency & ordering
- **Key by `contractId`** → all events for one contract share a partition → ordered and never
  processed concurrently.
- **Idempotent upsert** keyed by `contractId (+version)`; add a **version guard** (don't let an older
  version overwrite a newer one).
- Wrap the write in `@Transactional`; **commit the offset after the DB commit** (ack-after-success).

## Concurrency & throughput
- Parallelism ceiling = **partition count** (scale via pods ≤ partitions).
- Use `@Blocking` (ordered) with Quarkus's worker pool for the blocking fetch+upsert.
- Throughput is **bound by v5 latency** — size partitions for that, not raw Kafka speed.

## Observability
- **Structured JSON logs** (`quarkus-logging-json`) + **correlation id** from the record header in MDC
  → every log line traceable.
- **OpenTelemetry** (`quarkus-opentelemetry`) → auto-propagated trace across Kafka → v5 → DB.
- **Metrics** (`micrometer-registry-prometheus`): consumer lag, processing time, DLQ count, v5
  latency/errors.
- **Health** (`smallrye-health`) reports the Kafka connection → wire liveness/readiness probes.
- **Alert on:** sustained lag, auth failures, DLQ growth.

## Config & environments
- **Externalise per profile** (`application-int/pre/prod`); same image, different config.
- **Secrets from Vault/Secret Manager** → K8s Secrets; **never log credentials**.
- Set `auto.offset.reset` **deliberately per environment**.

## Testing
- **Dev Services** — Quarkus auto-starts Kafka + Postgres for dev/tests (no manual containers).
- **Kafka Companion** (`quarkus-test-kafka-companion`) — integration tests incl. **DLT assertions**
  (produce poison → assert on `contract-events-dlt` + the `dead-letter-reason` headers).
- **In-memory connector** — fast unit-style tests of consumer logic (does NOT exercise real DLT routing).

## Graceful shutdown
- Quarkus drains in-flight messages and commits offsets on shutdown — verify the shutdown timeout is
  long enough that a mid-process message finishes and acks (no loss on rolling restart).

---

## Always / Never
**Always:** `@Blocking` (ordered) for JDBC/REST · ack after success · idempotent + version guard ·
key by `contractId` · retry transient → DLQ permanent · circuit-break the v5 call · bound reconnects ·
correlation id + lag/auth/DLQ alerts.

**Never:** blocking work on the event loop · `enable.auto.commit` · ack before processing · retry
permanent failures · `@Blocking(ordered=false)` for keyed events · credentials in logs.

## One-liner
> Mark the blocking fetch+upsert **`@Blocking` (ordered)**, ack after success, key by `contractId`,
> make the upsert idempotent with a version guard, retry transient → DLQ permanent, circuit-break the
> v5 call, bound reconnects, and wire correlation-id + lag/auth/DLQ observability. Test with Dev
> Services + the Kafka Companion.

---
*Reference notes. Contains internal project names — handle per LBG data-handling policy.*
