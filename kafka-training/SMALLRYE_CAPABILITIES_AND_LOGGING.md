# SmallRye Reactive Messaging — Capabilities, Validation & Logging

A learning/reference guide for the Contract Ingestion consumer. Three parts:
1. **SmallRye Reactive Messaging** — the full capability surface (not just `@Incoming`).
2. **Event / message validation** — how to validate what we consume.
3. **Structured logging** (`quarkus-logging-json`) — how the configured logging library is used.

> All generic Quarkus/SmallRye knowledge — no LBG specifics. Config keys and some behaviours
> vary by version; **verify against Quarkus 3.20** (the version in the service). Official docs:
> SmallRye Reactive Messaging, Quarkus "Kafka Reference Guide", Quarkus "Logging" guide.

---

## PART 1 — SmallRye Reactive Messaging capabilities

### 1.1 The core programming model
The whole library is built on **channels**. A channel is a named stream; connectors wire a
channel to a broker (Kafka, etc.) via config.

| Annotation / type | Role |
|---|---|
| `@Incoming("ch")` | **consume** from a channel (a bean method) |
| `@Outgoing("ch")` | **produce** to a channel (return value is sent) |
| `@Incoming` + `@Outgoing` on one method | **processor** — transform in, transform out |
| `@Channel("ch")` + `Emitter<T>` | **imperative send** from arbitrary code |
| `@Channel("ch")` + `Multi<T>` | **imperative receive** as a reactive stream |

```java
@Incoming("contract-events")                      // consume
public void consume(ContractEventDto e) { ... }

@Incoming("contract-events") @Outgoing("validated")  // processor
public ContractEventDto process(ContractEventDto e) { return transform(e); }

@Channel("audit") Emitter<AuditDto> emitter;      // imperative produce
emitter.send(new AuditDto(...));
```

### 1.2 Connectors (not just Kafka)
The same programming model runs over many brokers — you swap the connector in config:
- **`smallrye-kafka`** (ours), AMQP 1.0, MQTT, JMS, RabbitMQ, **Apache Pulsar**, Google Cloud Pub/Sub, Camel.
- **`smallrye-in-memory`** — swap the connector in tests; no broker needed (see §1.11).

### 1.3 Payload vs Message — the key choice
- **Consume the payload `T`** → simplest; SmallRye **auto-acks** after the method returns.
- **Consume `Message<T>`** → full control: **manual ack/nack**, and access to **metadata & headers**.

```java
@Incoming("contract-events")
public CompletionStage<Void> consume(Message<ContractEventDto> msg) {
    var meta = msg.getMetadata(IncomingKafkaRecordMetadata.class).orElseThrow();
    String key = (String) meta.getKey();
    long offset = meta.getOffset();
    Headers headers = meta.getHeaders();          // read correlationId etc.
    return service.process(msg.getPayload())
                  .thenCompose(v -> msg.ack())     // ack AFTER success
                  .exceptionallyCompose(t -> msg.nack(t));   // nack -> DLQ
}
```

### 1.4 Flexible method signatures
SmallRye accepts many shapes — it adapts to your style:
- **Imperative:** `void consume(T)` / `CompletionStage<Void>` / `Uni<Void>`.
- **Reactive (Mutiny):** consume/return `Multi<T>` / `Uni<T>` / Reactive Streams `Publisher`.
- **Stream topologies:** chain `@Incoming`/`@Outgoing` methods to build a pipeline of channels.

### 1.5 `@Blocking` and threading (the #1 practical knob)
SmallRye runs `@Incoming` on the **Vert.x event loop** by default. Our work (v5 REST call +
JDBC upsert) is **blocking** → must move off the event loop:
- **`@Blocking`** → run on a worker thread. `ordered = true` (default) preserves per-partition order.
- **`@Blocking(ordered = false)`** → faster, **breaks ordering** (don't use for keyed contract events).
- **`@RunOnVirtualThread`** → Quarkus virtual-thread alternative for blocking work (Java 21+).

### 1.6 Acknowledgment strategies
Controls *when* a message is acked relative to your processing:
- `@Acknowledgment(Strategy.POST_PROCESSING)` — default for payload methods (**ack after success**).
- `PRE_PROCESSING` — ack before (risk of loss; avoid for us).
- `MANUAL` — you call `msg.ack()` / `msg.nack()` yourself (with `Message<T>`).
- `NONE`.

### 1.7 Offset commit strategies (Kafka)
How committed offsets are written back:
- `commit-strategy=throttled` — **default** for at-least-once; periodic, efficient. **Keep this.**
- `latest` — commit after each (simpler, more overhead).
- `ignore` — you manage commits (advanced).
- **Never** `enable.auto.commit=true` — it commits regardless of success → message loss.

### 1.8 Failure strategies (what happens on nack)
Per incoming channel, `failure-strategy=`:
- `fail` — stop the connector (default; safe but halts the pipeline).
- `ignore` — skip and continue (silent data loss — avoid).
- **`dead-letter-queue`** — publish the failed record to a DLT (**our choice**).
- `delayed-retry-topic` / custom — advanced retry-topic patterns (version-dependent).

```properties
mp.messaging.incoming.contract-events.failure-strategy=dead-letter-queue
mp.messaging.incoming.contract-events.dead-letter-queue.topic=contract-events-dlt
```
> `dead-letter-queue` sends on the **first** nack — it does not retry by itself. For
> "retry N then DLQ", add `@Retry` from SmallRye Fault Tolerance (see §1.14).

### 1.9 Metadata & headers (read and write)
- **Read** incoming Kafka metadata: `IncomingKafkaRecordMetadata` → topic, partition, offset,
  key, timestamp, **headers** (where correlationId lives).
- **Write** outgoing metadata: `OutgoingKafkaRecordMetadata` → set key, partition, headers when producing.

### 1.10 Serialization / deserialization
- Configure serde per channel (`value.deserializer`, or Avro + Schema Registry serde).
- **Deserialization failure handler** — `*.deserialization-failure-handler` routes un-parseable
  bytes to a handler/DLQ instead of crashing the consumer (can't retry a bad byte array).

### 1.11 Testing support
- **In-memory connector** — `InMemoryConnector.switchIncomingChannelsToInMemory(...)` in a
  `@QuarkusTest`; fast unit-style tests of consumer logic (no broker; does **not** exercise real DLT).
- **Kafka Companion** (`quarkus-test-kafka-companion`) — real-broker integration tests; produce
  poison records and **assert on the DLT** + `dead-letter-reason` headers.
- **Dev Services** — Quarkus auto-starts Kafka + Postgres for dev/test (no manual containers).

### 1.12 Concurrency & throughput
- `mp.messaging.incoming.<ch>.concurrency=N` — process a channel with N concurrent streams
  (partition-aware). Ceiling is still **partition count**.
- Kafka connector can also create multiple underlying consumers; scale real parallelism via
  **pods ≤ partitions**.

### 1.13 Batch consumption
- `mp.messaging.incoming.<ch>.batch=true` → consume a **`List<T>`** / `Message<List<T>>` per poll.
- Higher throughput; you ack the batch. Trade-off: coarser failure granularity (weigh vs DLQ precision).

### 1.14 Resilience (via SmallRye Fault Tolerance — separate extension, integrates cleanly)
Put these on the **service** method called by the consumer:
- **`@Retry`** (+ `@ExponentialBackoff`) — retry transient, `abortOn` permanent → DLQ.
- **`@CircuitBreaker`** — stop hammering a failing dependency (the v5 API).
- **`@Timeout`** — bound slow calls.
- **`@Fallback`** — a degraded path if you want one.

### 1.15 Advanced routing annotations
- **`@Broadcast`** — one incoming channel fans out to **multiple** consumers in-process.
- **`@Merge`** — merge **multiple** producers into one channel.
- **Pausable channels** — pause/resume consumption (back-pressure / maintenance).
- **Emitter / MutinyEmitter** — bridge imperative code into a channel (e.g. produce from a REST call).

### 1.16 Observability (built-in hooks)
- **Health** — the Kafka connector contributes to **readiness** (`/q/health/ready`): broker
  unreachable → not ready.
- **Metrics** — per-channel throughput via Micrometer.
- **Tracing** — `quarkus-opentelemetry` auto-propagates `traceparent` across Kafka → v5 → DB.

### 1.17 Capability cheat-sheet
| Need | SmallRye feature |
|---|---|
| Consume | `@Incoming` |
| Produce | `@Outgoing` / `Emitter` |
| Manual ack | `Message<T>` + `ack()/nack()` |
| Move blocking work off event loop | `@Blocking` / `@RunOnVirtualThread` |
| DLQ | `failure-strategy=dead-letter-queue` |
| Retry/CB/timeout | `@Retry`/`@CircuitBreaker`/`@Timeout` (Fault Tolerance) |
| Read headers/offset | `IncomingKafkaRecordMetadata` |
| Batch | `batch=true` → `List<T>` |
| Fan-out / merge | `@Broadcast` / `@Merge` |
| Test without broker | in-memory connector |
| Integration test DLT | Kafka Companion |

---

## PART 2 — Event / message validation

### 2.1 The library: Hibernate Validator (Bean Validation / Jakarta Validation)
Extension: **`quarkus-hibernate-validator`** (in the Golden Path stack). Two ways to use it.

### 2.2 Declarative — annotate the DTO
```java
public class ContractEventDto {
    @NotBlank         private String contractId;
    @Positive         private long   version;
    @NotNull          private EventType eventType;   // enum = allowed-values guard
    @NotBlank         private String correlationId;
    // @Pattern, @Size, @Email, @Past/@Future, @Valid (nested) ...
}
```
Common constraints: `@NotNull`, `@NotBlank`, `@NotEmpty`, `@Size`, `@Pattern`, `@Positive`,
`@Min/@Max`, `@Past/@Future`, `@Email`, `@Valid` (cascade to nested objects).

### 2.3 Programmatic — inject the `Validator` (recommended in messaging)
`@Valid` on a method parameter isn't reliably auto-triggered on `@Incoming`, so validate
**explicitly** in your service — it's clearer and you control the failure type:
```java
@Inject Validator validator;

public void process(ContractEventDto event) {
    Set<ConstraintViolation<ContractEventDto>> violations = validator.validate(event);
    if (!violations.isEmpty()) {
        String msg = violations.stream()
            .map(v -> v.getPropertyPath() + " " + v.getMessage())
            .collect(Collectors.joining("; "));
        throw new InvalidEventException(msg);   // -> abortOn -> DLQ
    }
    // ... proceed
}
```

### 2.4 Custom constraints (business rules)
For rules beyond "not null" — e.g. eventType must be in a supported set, lifecycle allowed:
```java
@Target({FIELD}) @Retention(RUNTIME)
@Constraint(validatedBy = SupportedEventTypeValidator.class)
public @interface SupportedEventType { String message() default "unsupported eventType"; ... }

public class SupportedEventTypeValidator
        implements ConstraintValidator<SupportedEventType, EventType> {
    public boolean isValid(EventType v, ConstraintValidatorContext ctx) {
        return v == EventType.CREATE || v == EventType.UPDATE || v == EventType.DELETE;
    }
}
```
Put validators in the Golden Path **`validation/`** package.

### 2.5 Validate at BOTH points
- **The event (trigger)** — before the expensive v5 call: mandatory fields, formats, allowed eventType.
- **The fetched contract** — before persisting: mandatory Marketplace fields, lifecycle state,
  data quality, and **event.contractId == fetched.contractId**.
- **Validation groups** let one DTO carry different rule sets per stage (`@Validated(OnFetch.class)`).

### 2.6 Validation failure → DLQ (never retry bad data)
- Throw a typed **`InvalidEventException`** → listed in `@Retry(abortOn = ...)` → straight to DLQ.
- Contrast: a **version guard** (incoming < stored) is **not** an error → **skip/no-op**, don't DLQ.

---

## PART 3 — Structured logging (`quarkus-logging-json`)

### 3.1 What the library does
Formats log output as **one JSON object per line** on stdout, so Splunk/Dynatrace can index every
field. Same image, different profile → JSON in deployed envs, plain text locally.

### 3.2 Enable & shape it (`application.yaml` / `.properties`)
```properties
# turn JSON on for the console (verify exact key for your version:
#  newer Quarkus uses quarkus.log.console.json.enabled=true)
quarkus.log.console.json=true

# how exceptions are rendered: formatted | structured | detailed
quarkus.log.console.json.exception-output-type=formatted

# static extra fields on every line (great for filtering in Dynatrace)
quarkus.log.console.json.additional-field."service.name".value=dmp-kafka-service
quarkus.log.console.json.additional-field."env".value=${QUARKUS_PROFILE:local}
```
Local dev readability:
```properties
%dev.quarkus.log.console.json=false
```

### 3.3 Log levels & categories (per package)
```properties
quarkus.log.level=INFO
quarkus.log.category."com.lbg.marketplace".level=DEBUG
quarkus.log.category."org.apache.kafka".level=WARN
```

### 3.4 Writing logs — the Quarkus `Log` API (what's in the code)
```java
import io.quarkus.logging.Log;   // static, zero-boilerplate

Log.infof("Received contract store event: %s chars", payload.length());
Log.warnf("v5 fetch failed for contract %s: %s", contractId, ex.getMessage());
Log.error("Unexpected failure", ex);   // pass the throwable for a stack trace
```
Alternatives: JBoss `Logger`, or MicroProfile — but `Log` is the Golden Path idiom.

### 3.5 Context via MDC — the part that makes logs traceable
Put IDs in **MDC** once; the JSON formatter adds them to **every** line automatically (under `mdc`):
```java
import org.jboss.logmanager.MDC;

MDC.put("correlationId", correlationId);   // from the Kafka record header
MDC.put("contractId", event.getContractId());
try {
    service.process(event);
} finally {
    MDC.clear();   // ALWAYS clear — worker threads are reused
}
```
Now filtering Dynatrace by one `correlationId` shows the **whole lifecycle of one contract** —
directly answers the "identifiable single errors" requirement.

### 3.6 Logging rules (bank context)
- **Never log** credentials, secrets, tokens, or sensitive PII / full sensitive payloads.
- Log **ids and metadata** (contractId, version, eventType, lengths, offsets) — not raw bodies.
- Log the **exception with context** (correlationId in MDC) **before** it routes to the DLT, so the
  DLT record's `dead-letter-reason` and your logs line up.

---

## One-paragraph summary
SmallRye Reactive Messaging gives us far more than `@Incoming`: producers/processors, manual
ack with `Message<T>`, `@Blocking` threading, DLQ failure strategy, header/offset metadata, batch
consumption, fan-out/merge, in-memory + Companion testing, and built-in health/metrics/tracing —
with resilience (`@Retry`/`@CircuitBreaker`/`@Timeout`) layered in from Fault Tolerance. We validate
events with Hibernate Validator (declarative + programmatic + custom rules) at two points (event and
fetched contract), routing bad data to the DLQ via a typed `InvalidEventException`. And
`quarkus-logging-json` emits structured JSON with a `correlationId` carried through MDC, so every
failure is traceable end-to-end.

---
*Reference notes. Generic Quarkus/SmallRye material — verify config keys against the project's
Quarkus version. Contains no LBG-confidential detail.*
