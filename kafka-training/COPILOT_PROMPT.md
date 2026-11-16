# Copilot prompt — Kafka consumer Phase 2 & 3 (read + fetch)

Paste the block below into **Copilot Chat** in the LBG repo (with `ContractStoreEventListener.java`
and `application.properties` open so Copilot has context). Adjust the API **paths**, the
`operationType` set, and the retry numbers to the real values before accepting.

> This is a spec, not code — no secrets. Fill LBG-specific URLs/paths on the LBG side.

---

```
You are working in a Java 17 + Quarkus microservice (SmallRye Reactive Messaging Kafka,
Hibernate Validator, SmallRye Fault Tolerance, Jackson). Base package: com.lbg.quarkus.
Follow the existing layered layout: dto, client, service, messaging, validation, exception.
Use Java records for DTOs. Generate complete, compiling classes.

GOAL: a Kafka consumer that reads a contract-store change event, validates it, extracts the
key fields, then fetches the full contract from TWO APIs concurrently and merges them.

EVENT (JSON on the topic), fields:
  eventId (UUID), operationType (enum: DATACONTRACT_CREATED/UPDATED/DELETED),
  version (string, event schema version), contractId (UUID),
  eventTimestamp (ISO-8601 Instant), source (string), correlationId (UUID),
  contractVersion (string, the contract's semver), status (enum: SUCCESS/FAILED),
  userId (string), collibraAssetId (string),
  error { httpStatus, errorCategory, sanitisedErrorMessage }, message (string).

CONTRACT STORE API response (large, nested) — map only this subset, ignore unknown fields:
  meta { status (int), hasError (bool), correlationId }
  response.data {
    id, version, apiVersion, kind, dataProduct, domain, status,
    description { purpose, usage, limitations },
    schema [ { name, physicalName, physicalType, properties:[ {name, logicalType, physicalType, required} ] } ],
    customProperties [ {property, value} ], contractCreatedTs, signature
  }

GOVERNANCE / REGISTRATION API response — fetch latest version with projection; fields:
  dataProductName, description, dataProductType, dataProductOwners (list),
  owningBusinessArea, productLifeCycleStage, relatedToGDMDataConcepts (list),
  securityClassification, dataUpdateFrequency, accessInstructions, status.

REQUIREMENTS:
1) DTO: ContractStoreEventDto record + OperationType, EventStatus enums + ErrorDetail record.
   Annotate with Jakarta Bean Validation (@NotBlank, @NotNull, @Pattern UUID, @Valid).
   Add @JsonIgnoreProperties(ignoreUnknown = true). Put the UUID regex in a ValidationPatterns class.
2) Deserialize JSON to the typed DTO via a class extending
   io.quarkus.kafka.client.serialization.ObjectMapperDeserializer<ContractStoreEventDto>.
   Set it as value.deserializer in config. Enable case-insensitive enums.
3) EventValidator (@ApplicationScoped): inject jakarta.validation.Validator, validate the event,
   throw InvalidEventException (a RuntimeException) listing the violations.
4) EventTrigger record: extract contractId, contractVersion, operationType, status, correlationId,
   with helpers isIngestable()/isDelete(); a static from(ContractStoreEventDto).
5) Listener (@ApplicationScoped): @Incoming("contract-store-events"), @Blocking,
   @Acknowledgment(Strategy.MANUAL). Consume Message<ContractStoreEventDto>; put correlationId
   and contractId into MDC; call the service; message.ack() on success, message.nack(e) on failure;
   clear MDC in finally.
6) Two reactive REST clients (@RegisterRestClient, return io.smallrye.mutiny.Uni<T>) for the
   Contract Store and Governance APIs, each with @Timeout and @CircuitBreaker.
7) ContractFetchService: call both clients concurrently with
   Uni.combine().all().unis(a,b).combinedWith(...); governance optional -> recoverWithItem(empty);
   contract failure -> TransientProcessingException; check meta.ok() (status==200 && !hasError).
8) ContractMerger: pure function merging the two responses into a MarketplaceRecord record
   (governance = product metadata, contract store = technical schema + signature; overlaps:
   governance wins, fall back to contract).
9) ContractIngestionService (@ApplicationScoped): @Retry(retryOn=TransientProcessingException,
   abortOn=InvalidEventException) + @ExponentialBackoff. Steps: validate -> extract ->
   skip if status != SUCCESS -> handle delete -> fetchService.buildRecord(id, version)
   .await().atMost(Duration.ofSeconds(30)) -> (TODO phase 4: idempotent upsert).
10) application.properties: connector=smallrye-kafka, topic/group from env, the typed
    deserializer, commit-strategy=throttled, enable.auto.commit=false, auto.offset.reset=earliest,
    failure-strategy=dead-letter-queue + dead-letter-queue.topic, fail-on-deserialization-failure=false,
    reconnect-attempts/interval, and rest-client base URLs for "contract-store" and "governance".

Generate all classes with imports, Javadoc, and the application.properties snippet.
```

---

## Add-on prompt — mock layer & failure scenarios

Paste this after the main prompt to generate the test/mock layer:

```
Add a WireMock-backed test layer so the consumer can be built and tested without the live APIs.
The seam is the REST client base URL — do NOT change any production code; only config + tests.

- QuarkusTestResourceLifecycleManager that starts a WireMock server on a dynamic port and returns
  config overrides pointing quarkus.rest-client."contract-store".url and
  quarkus.rest-client."governance".url at it; inject the server into tests.
- Semi-real fixtures in src/test/resources/__files/: a full Contract Store response (ODCS v3 shape),
  a "contract not returned" response (meta.status=200, hasError=false, response.data=null), and a
  Governance product response (the 11 fields). Topic events in src/test/resources/events/:
  success, failed (status=FAILED), malformed (missing contractId).
- A ContractNotFoundException thrown by the fetch service when the contract store returns no data
  (data==null or id==null); add it to @Retry(retryOn=...) for a short consistency-race retry.
- Scenario tests asserting: happy path merges both sources; FAILED-status event is skipped;
  malformed event -> InvalidEventException; contract id not returned -> ContractNotFoundException;
  contract store 500 or meta.hasError -> TransientProcessingException; governance 404 ->
  recovered to empty, record still built.
- In src/test/resources/application.properties set MP_Fault_Tolerance_NonFallback_Enabled=false so
  @Retry backoff doesn't slow the tests.
- Use the chassis-provided Mockito (@InjectMock @RestClient) as a fallback if WireMock is not
  available as a dependency. WireMock is TEST-ONLY — never add it to the runtime image; deployed
  environments point the url properties at the real APIs.
```

---

### After Copilot generates it
- Fix the **API paths** (`/contracts/{id}`, the governance **versions** endpoint).
- Confirm **which key** the APIs take (`contractId` vs `collibraAssetId`).
- Confirm the **overlap merge rules** (description/status) and **delete** semantics.
- Set real **retry/timeout** numbers per the team's SLA.
- Add **WireMock fixtures** (one Success event, one FAILED event, one contract response, one
  governance response) to test it without live APIs.
