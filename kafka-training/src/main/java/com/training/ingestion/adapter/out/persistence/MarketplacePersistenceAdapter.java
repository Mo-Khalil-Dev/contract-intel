package com.training.ingestion.adapter.out.persistence;

import com.training.ingestion.domain.model.MarketplaceContract;
import com.training.ingestion.domain.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Component;

/**
 * OUTBOUND (driven) ADAPTER implementing MarketplaceRepositoryPort.
 *
 * It translates the domain model <-> the JPA entity, so the domain stays pure.
 * This is where "upsert a MarketplaceContract" (domain language) becomes
 * "save a MarketplaceRecordEntity" (infrastructure).
 */
@Component
public class MarketplacePersistenceAdapter implements MarketplaceRepositoryPort {

    private final MarketplaceJpaRepository jpa;

    public MarketplacePersistenceAdapter(MarketplaceJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void upsert(MarketplaceContract contract) {
        // save() inserts or updates by primary key -> idempotent
        jpa.save(new MarketplaceRecordEntity(
                contract.contractId(),
                contract.version(),
                contract.name(),
                contract.description(),
                contract.updatedAt()
        ));
    }

    @Override
    public long count() {
        return jpa.count();
    }
}
