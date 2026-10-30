package com.training.ingestion.domain.port.in;

import com.training.ingestion.domain.model.ContractChange;

/**
 * INPUT PORT (driving side): what the application can DO, as an interface.
 *
 * Inbound adapters (the Kafka listener, the test web endpoint) depend on THIS,
 * never on the concrete service class. Dependencies point inward toward the domain.
 */
public interface IngestContractUseCase {

    void ingest(ContractChange change);
}
