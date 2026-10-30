package com.training.ingestion.adapter.in.kafka;

import com.training.ingestion.domain.model.ContractChange;
import com.training.ingestion.domain.port.in.IngestContractUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * INBOUND (driving) ADAPTER.
 *
 * Its only jobs: receive the Kafka message, translate it into the domain's language,
 * hand it to the use case, and commit the offset. It depends on the
 * IngestContractUseCase PORT — not on the concrete service. Thin by design.
 */
@Component
public class ContractEventListener {

    private static final Logger log = LoggerFactory.getLogger(ContractEventListener.class);

    private final IngestContractUseCase ingestContract;

    public ContractEventListener(IngestContractUseCase ingestContract) {
        this.ingestContract = ingestContract;
    }

    @KafkaListener(topics = "${app.topic}", groupId = "data-marketplace-subscriber")
    public void onMessage(ContractEventMessage message, Acknowledgment ack) {
        log.info("Consumed message: {}", message);

        // Translate the wire DTO into the domain model, then delegate.
        ContractChange change = new ContractChange(
                message.contractId(), message.version(), message.eventType());

        ingestContract.ingest(change);

        // GOLDEN RULE 3 companion: commit the offset only after success.
        ack.acknowledge();
    }
}
