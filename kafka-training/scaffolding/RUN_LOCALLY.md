# Run the consumer locally (personal machine)

A **standalone, community-Quarkus** build of the Contract Store consumer. It compiles and
runs entirely from **Maven Central** — no LBG Nexus, no chassis BOM — so it works on a
personal laptop. Package names are kept as `com.lbg.quarkus` so files copy straight back
into the LBG repo.

- **Validated:** compiles and **all 26 tests pass** on Quarkus **3.39.5** (which supports Java 25).

## Prerequisites
- **JDK 25** (matches the LBG chassis). Check: `java -version` → 25
- **Maven** (or use the included `./mvnw`)
- **Docker / OrbStack** running — only needed for `quarkus:dev` (Dev Services starts Kafka). Tests don't need it.

## Run the tests (no Docker needed)
```bash
cd kafka-training/scaffolding
./mvnw test
```
Unit tests + the WireMock scenario tests run in-process (in-memory Kafka connector).

## Run in dev mode (needs Docker/OrbStack)
```bash
./mvnw quarkus:dev
```
- Dev Services auto-starts a Kafka broker + Kafka UI.
- Debug port is 5005 (attach a Remote JVM Debug in IntelliJ).

## Produce a test event into the local topic
With `quarkus:dev` running, publish a `Success` event to `contract_store_events` (e.g. via the
Dev Services Kafka UI, or `kafka-console-producer`). Use the body from
`src/test/resources/events/event-success.json`. Set a breakpoint in
`ContractStoreEventListener.on... / ContractIngestionService.process` to watch it flow.

## Point the API clients at WireMock (until the real APIs are reachable)
The REST clients default to `http://localhost:8089`. Run a standalone WireMock there and stub:
- `GET /contracts/{id}` → `src/test/resources/__files/contract-store-response.json`
- `GET /products/{id}/versions/latest` → `src/test/resources/__files/governance-product.json`
Or just rely on the scenario tests, which stub both.

## What this maps to in the LBG repo
Same classes/packages as the LBG service (`dto`, `messaging`, `services`/`service`, `client`,
`exception`, `validation`). Differences are **build-only**: community Quarkus BOM instead of the
chassis, Maven Central instead of Nexus, and the Quarkus **REST Client** (`@RegisterRestClient`)
instead of the hand-rolled `JsonHttpClient` the LBG build fell back to.

> Generic scaffolding — no LBG secrets. Fill real URLs/credentials only on the LBG side.
