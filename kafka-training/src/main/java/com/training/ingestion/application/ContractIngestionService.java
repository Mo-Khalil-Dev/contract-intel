package com.training.ingestion.application;

import com.training.ingestion.domain.model.ContractChange;
import com.training.ingestion.domain.model.MarketplaceContract;
import com.training.ingestion.domain.port.in.IngestContractUseCase;
import com.training.ingestion.domain.port.out.ContractStorePort;
import com.training.ingestion.domain.port.out.MarketplaceRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * APPLICATION service — the use case. It orchestrates the flow and depends ONLY on
 * domain ports (abstractions), never on Kafka, an HTTP client, or JPA.
 *
 *  - DI principle:        both collaborators arrive via the CONSTRUCTOR, as interfaces.
 *  - Dependency Inversion: it talks to ContractStorePort / MarketplaceRepositoryPort,
 *                          not to the concrete adapters that implement them.
 *  - Clean Architecture:  it sits between the inbound and outbound adapters and points
 *                          inward to the domain model.
 *
 * (Purists keep the application layer framework-free and wire it in @Configuration.
 *  We keep @Service here for pragmatism; the principle — depend on ports — still holds.)
 */
@Service
public class ContractIngestionService implements IngestContractUseCase {

    private static final Logger log = LoggerFactory.getLogger(ContractIngestionService.class);

    private final ContractStorePort contractStore;
    private final MarketplaceRepositoryPort marketplace;

    public ContractIngestionService(ContractStorePort contractStore,
                                    MarketplaceRepositoryPort marketplace) {
        this.contractStore = contractStore;
        this.marketplace = marketplace;
    }

    @Override
    public void ingest(ContractChange change) {
        log.info("1. Ingesting change: {}", change);

        if (change.isPoison()) {
            throw new IllegalArgumentException("Poison change cannot be processed: " + change);
        }

        // GOLDEN RULE 1: the change is only a trigger — fetch the truth via the port.
        MarketplaceContract contract = contractStore.fetch(change.contractId(), change.version());
        log.info("2. Fetched full contract: {}", contract.name());

        // GOLDEN RULE 2: idempotent upsert via the port, keyed by contract id.
        marketplace.upsert(contract);
        log.info("3. Upserted {}. Total rows now: {}", contract.contractId(), marketplace.count());
    }
}
