package com.training.ingestion.listener;

import com.training.ingestion.client.FakeContractStoreClient;
import com.training.ingestion.event.ContractEvent;
import com.training.ingestion.persistence.MarketplaceRecord;
import com.training.ingestion.persistence.MarketplaceRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * THE HEART OF THE WHOLE THING.
 *
 * You do NOT write a poll loop. You annotate a method with @KafkaListener and
 * Spring calls it once per event. That is the "pull" model: Spring pulls from
 * Kafka for you and hands you one event at a time.
 *
 * This single method walks the middle of the HLD diagram:
 *   consume -> (validate) -> fetch from API -> transform -> upsert -> commit offset
 */
@Component
public class ContractEventListener {

    private static final Logger log = LoggerFactory.getLogger(ContractEventListener.class);

    private final FakeContractStoreClient contractStoreClient;
    private final MarketplaceRecordRepository repository;

    public ContractEventListener(FakeContractStoreClient contractStoreClient,
                                 MarketplaceRecordRepository repository) {
        this.contractStoreClient = contractStoreClient;
        this.repository = repository;
    }

    @KafkaListener(topics = "${app.topic}", groupId = "data-marketplace-subscriber")
    public void onContractEvent(ContractEvent event, Acknowledgment ack) {
        log.info("1. Consumed event: {}", event);

        // Demo hook for the DLQ: a "POISON" event always fails, so you can watch
        // it get retried and then land on the .DLT topic (see KafkaConfig).
        if ("POISON".equalsIgnoreCase(event.eventType())) {
            throw new IllegalArgumentException("Poison event cannot be processed: " + event);
        }

        // GOLDEN RULE 1: the event is only a trigger. Go fetch the real data.
        var contract = contractStoreClient.fetch(event.contractId(), event.version());
        log.info("2. Fetched full contract from the (fake) v5 API: {}", contract.name());

        // Transform into the marketplace model (the "Contract Normalizer" box).
        var record = new MarketplaceRecord(
                contract.contractId(),
                contract.version(),
                contract.name(),
                contract.description(),
                Instant.now()
        );

        // GOLDEN RULE 2: idempotent upsert. Same contractId -> same row, never a duplicate.
        repository.save(record);
        log.info("3. Upserted marketplace record. Total rows now: {}", repository.count());

        // GOLDEN RULE 3: commit the offset ONLY after everything above succeeded.
        // If the app crashed before this line, the event would be redelivered (at-least-once).
        ack.acknowledge();
        log.info("4. Offset committed. Done.\n");
    }
}
