# LBG Data Marketplace — Stack & Conventions

Captured from the sibling service `797530-dmp-01-search-service` (`pom.xml` on `main`).
**Our Kafka consumer must match this stack and these conventions.**

> ⚠️ Correction 1 (framework): the real stack is **Quarkus**, not Spring Boot. The
> Spring Boot practice project taught the right *concepts* (Kafka, DI, idempotency,
> DLQ) — which transfer unchanged — but the real service is Quarkus.
>
> ⚠️ Correction 2 (architecture): the LBG **"Golden Path"** reference service uses a
> **conventional layered package structure** (services / repositories / dto / entities /
> mapper / resources …), **NOT** the hexagonal/Clean-Architecture ports-and-adapters
> layout we built in the practice project for learning. **For the real repo, follow the
> Golden Path layout** (see §6). The *principles* (thin entry point, constructor DI,
> idempotency, DLQ) still apply — just inside the team's conventional structure.

---

## 1. The stack (from the search service pom.xml)

- **Framework:** Quarkus **3.20.0** (BOM `io.quarkus.platform:quarkus-bom`)
- **Java:** 17 (`maven.compiler.release`)
- **Build:** Maven + `quarkus-maven-plugin`; Sonar + JaCoCo for coverage

**Quarkus extensions in use:**

| Concern | Extension |
|---|---|
| CDI (DI container) | `quarkus-arc` |
| Config | `quarkus-config-yaml` |
| REST API | `quarkus-rest-jackson` (RESTEasy Reactive) |
| OpenAPI | `quarkus-smallrye-openapi` |
| Health | `quarkus-smallrye-health` |
| Context propagation | `quarkus-smallrye-context-propagation` |
| DB / ORM | `quarkus-jdbc-postgresql`, `quarkus-hibernate-orm-panache` |
| Validation | `quarkus-hibernate-validator` |
| DB migrations | `quarkus-flyway` |
| REST client (outbound) | `quarkus-rest-client`, `quarkus-rest-client-jackson` |
| Security | `quarkus-security`, `quarkus-elytron-security-common`, `quarkus-cache` |
| JWT | `jjwt-api/impl/jackson` 0.12.6, `com.auth0:java-jwt` 4.4.0 |
| Metrics | `quarkus-micrometer-registry-prometheus` |
| Structured logging | `io.quarkiverse.loggingjson:quarkus-logging-json` |
| Boilerplate | `org.projectlombok:lombok` 1.18.32 (provided) |
| LBG internal | `com.lloydsbanking:cortex-devkit` 0.3.0 |
| Utils | `commons-lang3`, `commons-collections4`, `commons-csv`, `uuid-creator`, `google-cloud-storage` |

**Testing:** JUnit 5 (`quarkus-junit5-mockito`), Mockito 5.14.2, REST Assured, `quarkus-jacoco`.

**Internal Maven repos (Nexus, via `settings.xml`):** `nexus.mgmt-bld.oncp.dev`,
`nexus.sbs-bld.oncp.dev`, `nexus.iw-bld.oncp.dev` — including a **`confluent-proxy`**
repo (→ Confluent Kafka/Avro libraries are available internally).

---

## 2. What OUR Kafka consumer ADDS (not in the search service)

The search service is a read/API service with no Kafka. For our consumer, add:

- **`quarkus-messaging-kafka`** — SmallRye Reactive Messaging Kafka connector (the consumer; `@Incoming`)
- **Avro + Schema Registry** — either:
  - Confluent serdes (`io.confluent:kafka-avro-serializer`, via the `confluent-proxy` Nexus repo), **or**
  - `quarkus-apicurio-registry-avro` (if LBG uses Apicurio) — ⚠️ confirm which registry
- Keep everything else the same (Panache/Postgres/Flyway, rest-client for the v5 API, micrometer, logging-json, health).

---

## 3. Naming conventions

**GitHub (Enterprise Cloud, org `Green`, Sinope workspace `797530`):**
- Repo pattern: `797530-dmp-<NN>-<name>-service`
- Search service: `797530-dmp-01-search-service`
- **Our repo (already provisioned): `797530-dmp-01-kafka-service`**

**Maven coordinates:**
- `groupId`: `com.lbg.marketplace`
- `artifactId` pattern: `dmp-<name>-service` (note: drops the `-01-`)
  - Search: `dmp-search-service`
  - **Ours (likely): `dmp-kafka-service`** — ⚠️ confirm exact name with the team
- `version`: `1.0.0-SNAPSHOT`

**Java package:** base `com.lbg.marketplace.*` (search service lives under
`com.lbg.marketplace.search.*`; ours likely `com.lbg.marketplace.kafka.*` or
`...ingestion.*` — ⚠️ confirm).

**Repo layout (observed):** `.github/`, `.harness/`, `docs/`, `helm/`, `postgres/`,
`src/`, `Dockerfile`, `docker-compose.yml`, `lbgmeta.yaml`, `settings.xml`,
`sonar-project.properties`, `wss.crt`, `CODEOWNERS`, `CONTRIBUTING.md`.

---

## 4. Spring → Quarkus mapping (so your learning transfers)

| Concept (what you learned) | Spring Boot | Quarkus equivalent |
|---|---|---|
| DI bean | `@Component`/`@Service` | `@ApplicationScoped` (CDI) |
| Constructor injection | constructor | same (or field `@Inject`) |
| **Kafka consumer** | `@KafkaListener` | **`@Incoming("channel")`** (SmallRye Reactive Messaging) |
| Kafka producer | `KafkaTemplate` | `@Outgoing` / `Emitter` |
| Consumer config | `spring.kafka.*` | `mp.messaging.incoming.<channel>.*` in `application.yaml` |
| DLQ | `DeadLetterPublishingRecoverer` | `failure-strategy=dead-letter-queue` (config) |
| Offset ack | manual `ack.acknowledge()` | SmallRye ack strategy (config/`@Acknowledgment`) |
| Repository | Spring Data `JpaRepository` | **Hibernate ORM + Panache** (`PanacheRepository`) |
| Idempotent upsert | `repository.save()` | `entity.persist()` / Panache upsert + `@Transactional` |
| Transactions | `@Transactional` | `@Transactional` (JTA) |
| REST client (v5 API) | `RestClient`/`WebClient` | `@RegisterRestClient` interface (`quarkus-rest-client`) |
| Resilience (retry/CB) | Resilience4j | **SmallRye Fault Tolerance**: `@Retry`, `@CircuitBreaker`, `@Timeout` |
| Health probes | Actuator `/actuator/health` | SmallRye Health `/q/health` |
| Metrics | Micrometer | `quarkus-micrometer-registry-prometheus` `/q/metrics` |
| Config properties | `@Value` / `@ConfigurationProperties` | `@ConfigProperty` (MicroProfile Config) |
| Migrations | Flyway | `quarkus-flyway` (same) |

**The point:** the *architecture* you designed (thin consumer → use case → ports/adapters,
idempotency, DLQ, fetch-the-truth) is identical in Quarkus. You rewrite the annotations,
not the thinking.

---

## 5. Open items to confirm with the team

1. Exact `artifactId` and base Java package for our service.
2. Schema Registry: **Confluent** (confluent-proxy repo) or **Apicurio**? → decides the Avro serde dep.
3. ~~Is there a Quarkus template to scaffold from?~~ ✅ **YES — the Golden Path** (`797530-dmp-producer-service`). Scaffold from it (see §6).
4. What `cortex-devkit` / `dmp-commons-lib` provide (LBG internal shared libraries).

---

## 6. The Golden Path template & REAL package structure

**Reference service:** `Green/797530-dmp-producer-service` — every file is tagged
*"dmp-producer-service Java Quarkus Golden Path"*. This is **the template to clone our
Kafka service from** (it already carries the correct Dockerfile, Helm, Harness, Backstage,
cert handling, and layout).

- Its Maven id: `com.lbg.marketplace:dmp-producer-api:0.0.1` (note: repo name ≠ artifactId).
- `dependencyManagement` imports the Quarkus BOM **and** `com.lbg.marketplace:dmp-commons-lib` (internal shared lib) — use the same.

**Real package layout** (`src/main/java/com/lbg/marketplace/…`) — conventional layered:

```
com/lbg/marketplace/
├── client/         outbound REST clients (e.g. the Contract Store v5 client)
├── config/         configuration classes
├── constants/      constants
├── dto/            data transfer objects (wire shapes)
├── entities/       Panache/JPA entities
├── exception/      exceptions + handlers
├── executor/       orchestration / executors
├── filter/         JAX-RS request/response filters
├── mapper/         DTO <-> entity/domain mappers
├── openapi/        OpenAPI config
├── repositories/   Panache repositories
├── resources/      JAX-RS REST endpoints (@Path)
├── services/       business logic
├── util/           utilities
├── validation/     validators
└── XxxServiceApplication.java
```
- Tests mirror this under `src/test/java/com/lbg/marketplace/…`.
- **For our Kafka consumer:** the producer template is REST-first (`resources/` = endpoints).
  We add a **`messaging/`** (or `consumer/`/`listener/`) package for the `@Incoming` Kafka
  consumer; everything else (services/repositories/entities/mapper/client) stays as-is.

## 7. Dockerfile & runtime (from the Golden Path)

- **Base image:** `innersource-artefacts-docker.lloydsbanking.cloud/ingested/ubi9/openjdk-17-runtime:1.22-…` (Red Hat UBI9 + OpenJDK 17)
- Imports `wss.crt` into the Java truststore (`keytool -importcert … cacerts`)
- **Quarkus fast-jar** layout, copied as **4 layers** (`quarkus-app/lib/`, `*.jar`, `app/`, `quarkus/`) so library layers cache between builds
- `EXPOSE 8080`, runs as non-root `USER 185`
- `JAVA_OPTS_APPEND=-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager`
- `ENTRYPOINT ["/opt/jboss/container/java/run/run-java.sh"]`
- Local dev: `docker-compose.yml` (app + postgres, `QUARKUS_LOG_FILE_ENABLE=false`) and `compose-devservices.yml` (Quarkus Dev Services)

**Other template files we inherit (don't hand-write these):** `catalog-info.yaml` (Backstage),
`mkdocs.yml` + `docs/` (docs site), `.harness/orgs/entdp/projects/sinope/…` (pipelines),
`helm/` (K8s), `lbgmeta.yaml` + `CODEOWNERS` (push-blocked — change via the documented process),
`ATTESTATION.md`, `INNERSOURCE.md`, `sonar-project.properties`, `settings.xml`, `wss.crt`.
