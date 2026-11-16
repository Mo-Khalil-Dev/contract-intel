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

## Mock layer (for when the APIs aren't ready)

The **seam is the REST client base URL** — swap real for mock via config, **no code change**:
```properties
# test / local dev  → WireMock
quarkus.rest-client."contract-store".url=http://localhost:8089
quarkus.rest-client."governance".url=http://localhost:8089
# INT / PRE / PROD   → the real APIs (set per env via Helm/Vault)
```

Files:
- `src/test/java/com/lbg/quarkus/WireMockResource.java` + `InjectWireMock.java` — start WireMock
  for the test run and point both clients at it.
- `src/test/java/com/lbg/quarkus/service/ContractIngestionScenarioTest.java` — the failure scenarios.
- `src/test/resources/__files/*.json` — semi-real API responses.
- `src/test/resources/events/*.json` — topic events (success / failed / malformed).
- `src/test/resources/application.properties` — disables Fault Tolerance in tests so `@Retry`
  backoff doesn't slow assertions.

### Failure scenarios covered
| Scenario | Fixture / stub | Expected |
|---|---|---|
| Happy path | contract + governance 200 | record built (governance + schema merged) |
| Upstream (Collibra) failure | `event-failed.json` (status FAILED) | **skipped** (not DLQ) |
| Malformed event (missing contractId) | `event-malformed.json` | `InvalidEventException` → DLQ |
| **Contract id not returned** | `contract-store-notfound.json` (data null) | `ContractNotFoundException` (retry → DLQ) |
| Contract Store 500 | WireMock `serverError()` | `TransientProcessingException` (retry → DLQ) |
| Contract Store `hasError=true` | inline stub | `TransientProcessingException` |
| Governance unavailable (404) | WireMock `notFound()` | recovers to empty → record still built |

> **WireMock is a TEST / LOCAL-DEV tool only — it is never deployed to GKE.** In INT/PRE/PROD the
> `url` properties point at the real APIs (set per environment). WireMock is not in the runtime image.
>
> **WireMock IS available in the LBG Nexus** (`maven-osg-proxy`). Use the modern 3.x artifact:
> ```xml
> <dependency>
>   <groupId>org.wiremock</groupId>
>   <artifactId>wiremock</artifactId>
>   <version>3.9.2</version>
>   <scope>test</scope>
> </dependency>
> ```
> WireMock 3.x kept the `com.github.tomakehurst.wiremock.*` package names, so the scaffolded
> `WireMockResource` and scenario test compile against it unchanged. If Jetty transitive conflicts
> appear in Quarkus tests, switch to the shaded `org.wiremock:wiremock-standalone:3.9.2`.
> (Avoid the old `com.github.tomakehurst:wiremock-jre8-standalone:2.21.0`; ignore
> `spring-cloud-contract-wiremock` — that's Spring.)
>
> The **unit tests** below need no WireMock at all (Mockito only), so they run regardless.

## Unit tests (plain JUnit + Mockito — no Quarkus boot, no WireMock)

Fast tests that need only chassis-provided libs (JUnit 5, Mockito, Hibernate Validator, Mutiny):
- `TestFixtures.java` — shared Jackson mapper + fixture loaders.
- `dto/ContractStoreEventDtoTest` — JSON → typed event (enums, Instant, error block).
- `dto/EventTriggerTest` — extraction + `isIngestable()` / `isDelete()`.
- `service/ContractMergerTest` — merge provenance + fallbacks.
- `service/EventValidatorTest` — valid passes, invalid throws with the field name.
- `service/ContractFetchServiceTest` — mocked clients; happy merge, not-found, 500, hasError,
  governance recovered.
- `service/ContractIngestionServiceTest` — mocked validator + fetch; routing (success / failed /
  delete / invalid).

The scaffolding uses **package-private fields** on the services so plain unit tests can inject
mocks without CDI; the real app still injects via `@Inject`.

> Generic material — verify config keys against the project's Quarkus version.
