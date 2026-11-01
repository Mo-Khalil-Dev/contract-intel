# LBG Data Marketplace — Stack & Conventions

Captured from the sibling service `797530-dmp-01-search-service` (`pom.xml` on `main`).
**Our Kafka consumer must match this stack and these conventions.**

> ⚠️ Correction: the real stack is **Quarkus**, not Spring Boot. The Spring Boot
> practice project in this folder taught the right *concepts* (Kafka, DI, DDD,
> idempotency, DLQ) — which transfer unchanged — but the real service is Quarkus.

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
3. Is there a **Quarkus service template / archetype** in Backstage we should scaffold from (so we inherit `settings.xml`, `lbgmeta.yaml`, Helm, Harness config)?
4. What `cortex-devkit` provides (LBG internal shared library).
