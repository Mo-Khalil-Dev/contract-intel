package com.training.ingestion.domain.port.out;

import com.training.ingestion.domain.model.MarketplaceContract;

/**
 * OUTPUT PORT (driven side): the application's need to persist a contract idempotently.
 *
 * Implemented by a persistence adapter. Note the domain speaks of "upsert a
 * MarketplaceContract" — it never mentions JPA, SQL, or a database. Those are
 * infrastructure details hidden behind this port.
 */
public interface MarketplaceRepositoryPort {

    void upsert(MarketplaceContract contract);

    long count();
}
