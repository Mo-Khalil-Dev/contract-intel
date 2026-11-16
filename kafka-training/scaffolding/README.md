# Consumer scaffolding — Phase 2 & 3 (read + fetch)

Generic, liftable scaffolding for the LBG Quarkus Kafka consumer. **No LBG specifics** —
field names from the agreed event shape only. Copy the `src/main/java/...` files into the
real repo (base package `com.lbg.quarkus`) and merge `application.properties`.

Covers the four things:

## 1. Validate the events received
- `dto/ContractStoreEventDto.java` — a typed `record` with Jakarta Bean Validation
  annotations (`@NotBlank`, `@NotNull`, `@Pattern`, `@Valid`). `@JsonIgnoreProperties(ignoreUnknown)`
  makes it forward-compatible with new producer fields.
- `service/EventValidator.java` — injects `Validator`, runs `validator.validate(event)`,
  throws `InvalidEventException` (permanent → DLQ) on any violation.
- Deserialization is handled at the connector via `messaging/ContractStoreEventDeserializer.java`
  (JSON → typed object). Un-parseable bytes → DLQ (can't retry).

## 2. Extract the version + contractId to use against the APIs
- `dto/EventTrigger.java` — the handful of fields we actually use
  (`contractId`, `contractVersion`, `operationType`, `status`, `correlationId`),
  plus `isIngestable()` / `isDelete()` helpers. The event is a **trigger**; the real data
  comes from the APIs.

## 3. Manual commit / acknowledge
- `messaging/ContractStoreEventListener.java` — consumes `Message<T>` with
  `@Acknowledgment(Strategy.MANUAL)`, calls `message.ack()` only **after** success and
  `message.nack(e)` on failure.
- **ack vs commit:** your code controls the **ack**; SmallRye then commits the **offset**
  per `commit-strategy=throttled`. We disable `enable.auto.commit`. This is correct
  at-least-once: offset advances only after a successful ack.

## 4. Failure strategy & resilience
- **DLQ:** `failure-strategy=dead-letter-queue` + `dead-letter-queue.topic` — on `nack`,
  SmallRye auto-publishes the record to the DLT with diagnostic headers.
- **Retry:** `@Retry` + `@ExponentialBackoff` on the service method — retries **transient**
  failures (`retryOn = TransientProcessingException`), aborts **permanent** ones
  (`abortOn = InvalidEventException`) straight to the DLQ.
- **Circuit breaker / timeout:** `@CircuitBreaker` + `@Timeout` go on the API clients
  (Phase 3 fetch stage).
- **Bounded reconnect:** `reconnect-attempts` / `reconnect-interval` so auth/connection
  failures don't loop forever.
- **Deserialization failure:** `fail-on-deserialization-failure=false` → route to DLQ.

## Flow
```
Kafka → deserialize (JSON→DTO)  →  @Blocking listener (manual ack)
      → service.process():
           validate            (invalid → InvalidEventException → DLQ)
           extract trigger
           gate on status       (non-Success → skip)
           [Phase 3] fetch Contract Store + Governance concurrently → merge
           [Phase 4] idempotent upsert (version guard)
      → ack (success)  |  nack (failure → DLQ, after retries)
```

> Generic material — verify config keys against the project's Quarkus version.
