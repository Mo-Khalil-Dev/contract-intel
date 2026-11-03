# Kafka Event Handling — Working Notes (SmallRye / Quarkus)

Reference notes for the Contract Store → Data Marketplace ingestion consumer.
Stack: **Quarkus + SmallRye Reactive Messaging (Kafka)**. Design: consume contract
change events → fetch full contract from the v5 API → validate → transform →
idempotent upsert; failures route to a DLQ.

---

## 1. Partition decisions

**What a partition is:** a topic is split into partitions — the unit of **parallelism**,
**ordering**, and the **ceiling on consumers** in a group.
- Ordering is guaranteed **only within a partition** → key events by `contractId` so all
  events for one contract land in the same partition and stay ordered.
- Max useful consumers in a group = **partition count** (extra pods sit idle).

**How to choose the number (formula):**
```
partitions = max( T / P , T / C )
  T = peak throughput (events/sec)
  P = one producer's per-partition throughput
  C = one consumer's per-partition throughput
```
For us the pipeline is **consumer-bound**: each event does a v5 API call + DB upsert, so
`C` is limited by that round-trip latency (~tens of ms), **not** raw Kafka speed.

**Our situation — bridged (Pattern B) design:** Helios's topic is replicated into our own
topic (Confluent Replicator / MirrorMaker 2), and we consume ours.
- **Rule: our topic's partition count must MATCH the Helios source topic.** Replication
  copies records partition-by-partition preserving keys; a different count breaks the
  key→partition mapping and loses ordering.
- So partition count is **inherited from Helios**, not chosen freely. Get the number from them.
- Replication factor and retention are **ours** (cluster standard, e.g. RF=3 in prod).

**Gotchas:**
- You can **increase** partitions later but **never decrease**.
- Increasing partitions **changes key→partition mapping** → breaks per-key ordering going
  forward → over-provision modestly up front instead.
- Too many partitions = more memory/file handles, slower rebalances, higher latency. Don't
  over-provision.

**Likely landing zone:** governance changes are **low volume** → **~3–6 partitions**,
inherited from the Helios source topic.

**SmallRye consumer concurrency:** to consume multiple partitions concurrently in one
instance, use multiple consumer threads / instances (still ≤ partition count). Within a
partition it's single-threaded (preserves order).

**Questions to confirm with Helios/KaaS:**
1. Source topic partition count? (sets ours)
2. Replication tool (Replicator vs MM2) and who operates it?
3. Replication factor + retention for our topic?
4. Any KaaS default/minimum partition convention?

---

## 2. Dead Letter Queue (DLQ)

**Key fact:** the DLT is a **real, separate Kafka topic** that **we own** (in our tenant),
but SmallRye **auto-publishes** failed messages to it — we don't write producer code for it.

**Config (`application.properties`):**
```properties
mp.messaging.incoming.contract-events.connector=smallrye-kafka
mp.messaging.incoming.contract-events.topic=contract-events
mp.messaging.incoming.contract-events.group.id=data-marketplace-subscriber

# DLQ: on nack, SmallRye publishes the record to this topic automatically
mp.messaging.incoming.contract-events.failure-strategy=dead-letter-queue
mp.messaging.incoming.contract-events.dead-letter-queue.topic=contract-events-dlt
mp.messaging.incoming.contract-events.dead-letter-queue.key.serializer=org.apache.kafka.common.serialization.StringSerializer
mp.messaging.incoming.contract-events.dead-letter-queue.value.serializer=org.apache.kafka.common.serialization.StringSerializer
```

**Important:** `failure-strategy=dead-letter-queue` sends to the DLT on the **first** nack.
It does **not** retry by itself. To get "retry N times, then DLQ", add `@Retry`.

**Retry → DLQ (fixed backoff, first version):**
```java
@Retry(
    maxRetries = 3,                                // 1 initial + 3 retries = 4 attempts
    delay = 1000, delayUnit = ChronoUnit.MILLIS,   // fixed 1s between attempts
    jitter = 0,                                    // truly fixed
    retryOn = TransientProcessingException.class,  // retry ONLY transient failures
    abortOn = InvalidEventException.class          // permanent → straight to DLQ
)
public void process(ContractEventDto event) { ... }
```
- Requires `quarkus-smallrye-fault-tolerance`.
- Put `@Retry` on the **service** method (CDI bean), called by the `@Incoming` consumer.
- `@ExponentialBackoff` (SmallRye) would grow the wait each time; we use fixed for v1.
- **Only retry transient failures**; abort permanent ones straight to the DLQ.

**Two failure points, two handlers:**
- **Deserialization failure** (bytes won't parse) → handle at the deserializer layer
  (`*.deserialization-failure-handler`, or route to DLQ). Can't retry.
- **Processing/validation failure** (parsed but invalid/transient) → `@Retry` + DLQ above.

**Diagnostic headers:** SmallRye stamps the DLT record with `dead-letter-reason`,
`dead-letter-cause`, and the original topic/partition/offset — the runbook uses these.
Correlation-id / original headers are copied over too → a dead-lettered event stays traceable.

**The DLT is not the end — still build:**
- **Alert** on DLT volume/growth.
- **Runbook** to inspect failures (use the headers).
- **Replay** (reprocess onto the main topic after a fix) or **quarantine/discard**.

**Spring equivalent (practice project):** `DefaultErrorHandler` + `DeadLetterPublishingRecoverer`
+ `FixedBackOff(1000L, 3L)` → `<topic>.DLT`. Same concept.

---

## 3. Typical problems in Kafka event handling (the catalogue)

### Delivery & ordering
| Problem | Mitigation |
|---|---|
| **Duplicate processing** (at-least-once delivery) | **Idempotent upsert** keyed by contractId (+version) |
| **Out-of-order / stale version overwrites newer** | **Version guard** (only upsert if incoming ≥ stored) |
| **Message loss** (commit before processing) | **Commit offset AFTER** successful processing |
| **Frequent rebalances** (consumers join/leave) | keep processing fast; tune `session.timeout`, `max.poll.interval` |
| **`max.poll.interval` exceeded** (slow processing → kicked from group → rebalance loop) | keep handler fast; smaller poll batches; move slow work off the poll thread |
| **Partition skew / hot keys** (one partition overloaded) | ensure good key cardinality; watch per-partition lag |

### Failures & resilience
| Problem | Mitigation |
|---|---|
| **Transient downstream failure** (v5 API / DB timeout, 5xx) | **Retry with backoff** (`@Retry`) |
| **Permanent failure** (bad/invalid data) | **DLQ** (don't retry) |
| **Poison message blocks the partition** | retry a few times then **DLQ**; never retry forever |
| **Cascading failure when a dependency is down** | **Circuit breaker** (SmallRye Fault Tolerance) |
| **404 from v5** (event references missing contract) | short retry (consistency race) → then DLQ or treat as delete (**DECIDE**) |
| **DLQ grows unnoticed** | **alert** on DLT volume |

### Data & schema
| Problem | Mitigation |
|---|---|
| **Deserialization failure** (bytes won't parse) | deserializer failure handler → DLQ |
| **Schema evolution breaks consumer** | Schema Registry + **compatibility policy**; test old+new |
| **Missing/invalid mandatory fields** | validation → DLQ |
| **Delete / tombstone not handled** | decide delete semantics (remove from Marketplace?) (**DECIDE**) |

### Offsets & state
| Problem | Mitigation |
|---|---|
| **Offset commit failure** | at-least-once → reprocess (idempotency covers it) |
| **Reprocessing after crash** | idempotency |
| **Wrong `auto.offset.reset`** (earliest re-reads all / latest skips) | set deliberately per environment |
| **Replay safety** (reprocessing history) | idempotency + runbook |

### Scaling & performance
| Problem | Mitigation |
|---|---|
| **Consumer lag growing** | scale **partitions + pods**; investigate slow stage |
| **Can't scale beyond partition count** | add partitions at source first (Helios) |
| **Blocking retries hold the partition** | short fixed retries; long backoff → non-blocking retry topic |
| **Throughput bound by downstream** (v5 API latency) | size partitions for `C`; consider batching/async carefully |

### Operational & security
| Problem | Mitigation |
|---|---|
| **Ungraceful shutdown loses in-flight work** | graceful shutdown (finish in-flight, commit) |
| **Cert/secret (JKS) or credential rotation drops the connection** | rotation process; alert on auth failures |
| **Auth / SSL misconfig** (can't connect) | correct truststore/keystore (wss.crt pattern) |
| **RBAC missing** (can't read source / write DLT) | request the right grants |
| **Network/firewall path blocked** | connectivity pipeline + firewall rules |
| **No visibility** (lag / DLQ / traces) | metrics + correlation-id logging + OTel tracing |
| **Config drift across environments** | externalised config per profile; same image everywhere |

### Bridged-design (replication) specific
| Problem | Mitigation |
|---|---|
| **Replication lag** (extra hop before we see events) | monitor replication lag **separately** from consumer lag |
| **Replication adds duplicates** (at-least-once) | idempotency (again) |
| **Partition mismatch source↔dest** breaks ordering | **match partition count** to source |
| **Schema not in our registry** (cross-cluster) | share registry or replicate schemas |

---

## 4. SmallRye / Quarkus cheat-sheet

| Need | SmallRye / Quarkus |
|---|---|
| Consume a topic | `@Incoming("channel")` on a bean method |
| Channel → topic/group/deserializer | `mp.messaging.incoming.<channel>.*` |
| Manual ack | `Message<T>` + `message.ack()` / `nack()` |
| DLQ | `failure-strategy=dead-letter-queue` + `dead-letter-queue.topic` |
| Retry | `@Retry` (+ `@ExponentialBackoff`) — `quarkus-smallrye-fault-tolerance` |
| Circuit breaker / timeout | `@CircuitBreaker`, `@Timeout` (same extension) |
| Call the v5 API | `@RegisterRestClient` interface (`quarkus-rest-client`) |
| Persist (idempotent upsert) | Hibernate ORM **Panache** repository + `@Transactional` |
| Local Kafka + Postgres for dev/test | **Quarkus Dev Services** (auto-starts containers) |
| Integration test the DLT | **Kafka Companion** (`quarkus-test-kafka-companion`) |
| Correlation ID | Kafka **record headers** → MDC → forward to v5 call; or `quarkus-opentelemetry` (auto `traceparent`) |
| Structured logs | `quarkus-logging-json` + MDC |
| Metrics | `quarkus-micrometer-registry-prometheus` (`/q/metrics`) |
| Health | `quarkus-smallrye-health` (`/q/health`) |

---

## 5. Decisions to confirm with the team

1. **Partitions:** source topic partition count (sets ours); replication tool & owner.
2. **Schema registry:** Confluent or Apicurio? Shared across clusters?
3. **Stale-version guard:** last-write-wins by version?
4. **404 handling:** retry window, or treat as delete?
5. **Delete/tombstone:** does a delete event remove the Marketplace record?
6. **Embedding failure:** hard-fail → DLQ, or degrade + backfill?
7. **Correlation/event ID:** does Helios include a header? what's it called?
8. **Rotation:** how are JKS certs / API creds rotated per environment?

---

*Prepared as personal study/reference notes. Contains internal project names (Helios,
Collibra, dmp-*) — handle per LBG data-handling policy.*
