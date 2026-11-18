# Contract Store Consumer — local, runnable project

A self-contained **Quarkus Kafka consumer** you can run and play with on your own machine.
Builds from **Maven Central** (community Quarkus **3.39.5**, **Java 25**) — no LBG Nexus, no
chassis. Package names are `com.lbg.quarkus.*` so files copy straight back into the LBG repo.

**Validated:** compiles + **26 tests pass** (unit + WireMock scenario tests).

What it does: consume a contract-store change event → validate → extract id/version →
fetch the full contract from two APIs (concurrently) → merge → (Phase 4: save). Failures go to a DLQ.

---

## Prerequisites
- **JDK 25** (`java -version` → 25)
- **Docker / OrbStack** running
- Maven (or use the bundled `./mvnw`)

## 1. Run the tests (no Docker needed)
```bash
./mvnw test
```
26 tests, all green — proves the logic and the failure scenarios.

## 2. Run it for real (with Docker)
```bash
docker compose up -d        # starts Kafka + Kafka UI (+ Postgres)
./mvnw quarkus:dev          # starts the consumer, connected to that Kafka
```
- **Kafka UI:** http://localhost:8085  — use it to create topics and produce events
- **App Dev UI:** http://localhost:8080/q/dev
- **Debugger:** attach a Remote JVM Debug to port **5005** in IntelliJ

## 3. Produce a test event and watch it flow
In **Kafka UI** (http://localhost:8085) → topic `contract_store_events` → **Produce Message**.
Paste a body from `src/test/resources/events/`:

- **`event-failed.json`** (status FAILED) → the consumer **skips** it (no API call needed). Easiest first test — you'll see "Skipping event…" in the logs.
- **`event-success.json`** (status Success) → the consumer tries to **fetch** the contract. For this to succeed you need the two APIs; run a WireMock stub (below) or watch it retry → DLQ.
- **`event-malformed.json`** (missing contractId) → fails validation → lands in `contract_store_events_dlq`.

Set a breakpoint in `ContractStoreEventListener` or `ContractIngestionService.process` to step through.

## 4. (Optional) Fake the two APIs with WireMock
The REST clients default to `http://localhost:8089`. Run a standalone WireMock there and stub:
- `GET /contracts/{id}` → `src/test/resources/__files/contract-store-response.json`
- `GET /products/{id}/versions/latest` → `src/test/resources/__files/governance-product.json`

Then a `event-success.json` message flows all the way through to a merged record.

## Stop
```bash
docker compose down         # stop containers
docker compose down -v      # stop and wipe Kafka/Postgres data
```

---

## Layout
```
src/main/java/com/lbg/quarkus/
  dto/        event + API response + merged record models (records + Bean Validation)
  messaging/  the @Incoming listener (manual ack) + JSON deserializer
  client/     the two reactive REST clients (@RegisterRestClient, Uni)
  service/    validate / extract / fetch+merge orchestration (@Retry, backoff)
  exception/  typed exceptions (transient / invalid / not-found)
  validation/ shared regex
src/test/...  unit tests + WireMock scenario tests + JSON fixtures
docker-compose.yml   Kafka + Kafka UI + Postgres
```

> Generic — no LBG secrets. Fill real URLs/credentials only on the LBG side.
