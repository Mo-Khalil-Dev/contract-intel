# Kafka Ingestion Training

A tiny, runnable Spring Boot project that mirrors the **LBG Contract Store → Data Marketplace**
ingestion design (EDPMARK-4815 / the HLD) — so you can practise the exact pattern on your laptop
with **fake data**, before real KaaS access lands.

> ⚠️ **Practice only.** Fake data, local Kafka. Never put real LBG data or credentials in here.

---

## What it demonstrates

The flow from the HLD, end to end:

```
POST /events  ->  Kafka topic  ->  @KafkaListener  ->  fetch from (fake) v5 API
                                                     ->  transform
                                                     ->  idempotent upsert into Postgres
                                                     ->  commit offset
                       (a failing event is retried, then sent to the .DLT topic)
```

The 3 golden rules, made concrete:
1. **Event = trigger, API = truth** → `ContractEvent` is tiny; real data comes from `FakeContractStoreClient`
2. **Be idempotent** → upsert keyed by `contractId`; same event twice = one row
3. **Fail to DLQ, don't block** → a `POISON` event is retried then dead-lettered

---

## Prerequisites (install these first)

| Tool | Check it works |
|---|---|
| JDK 21 (`sdk install java 21-tem`) | `java -version` → 21 |
| Docker Desktop (running) | `docker run hello-world` |
| IntelliJ IDEA | opens, sees JDK 21 |
| Maven | bundled with IntelliJ, or `mvn -version` |

---

## Run it (5 steps)

### 1. Start the infrastructure (Kafka + Postgres + UIs)
```bash
cd kafka-training
docker compose up -d
```
- Kafka UI → http://localhost:8080  *(✅ you should see a cluster called "local")*
- Postgres → localhost:5432 (user/pass/db all = `marketplace`)

### 2. Open the project in IntelliJ
`File → Open` → select the `kafka-training` folder. Let it import the Maven project.

### 3. Run the app
Open `KafkaTrainingApplication` → click the green ▶.
✅ Console shows `Started KafkaTrainingApplication`.

### 4. Publish a normal event
```bash
curl -X POST localhost:8090/events -H "Content-Type: application/json" \
     -d '{"contractId":"C-001","version":"1","eventType":"contract.updated"}'
```
✅ In the app console you'll see the 4 numbered log lines (consumed → fetched → upserted → committed).

### 5. Prove idempotency, then the DLQ
```bash
# Send the SAME event again -> "Total rows now: 1" (NOT 2). That's idempotency.
curl -X POST localhost:8090/events -H "Content-Type: application/json" \
     -d '{"contractId":"C-001","version":"1","eventType":"contract.updated"}'

# Send a poison event -> retried twice, then ">>> DLQ: ..." appears. That's the dead-letter queue.
curl -X POST localhost:8090/events -H "Content-Type: application/json" \
     -d '{"contractId":"C-666","version":"1","eventType":"POISON"}'
```

### See the data
- In Kafka UI: open the `contract-events` and `contract-events.DLT` topics and read the messages.
- In Postgres: `docker exec -it training-postgres psql -U marketplace -d marketplace -c "select * from marketplace_records;"`

### Stop everything
```bash
docker compose down        # keeps data
docker compose down -v      # wipes data too
```

---

## Where each HLD box lives in the code

| HLD box | File |
|---|---|
| Event on the topic | `event/ContractEvent.java` |
| Marketplace Subscriber (consumer) | `listener/ContractEventListener.java` |
| v5 API Client | `client/FakeContractStoreClient.java` |
| Transform + Upsert | `listener/ContractEventListener.java` + `persistence/` |
| DLQ / Error Handler | `config/KafkaConfig.java` + `listener/DeadLetterListener.java` |
| Marketplace table | `persistence/MarketplaceRecord.java` |

---

## Suggested learning order (matches the phases)

1. Get it running (steps above) — see the pull model work
2. Read `ContractEventListener` line by line — it's the whole job in one method
3. Break things on purpose: stop the app mid-flow, restart, watch events redeliver
4. Change the upsert to key on `contractId + version` and see the difference
5. Later: swap JSON for Avro against the Schema Registry (Phase 8)

Confluent Kafka 101 (free): https://developer.confluent.io/courses/apache-kafka/events/
