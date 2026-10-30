package com.training.ingestion.domain.port.out;

import com.training.ingestion.domain.model.MarketplaceContract;

/**
 * OUTPUT PORT (driven side): what the application NEEDS from the outside world —
 * the ability to fetch the full contract from the source of truth.
 *
 * The application depends on this ABSTRACTION. An adapter in the infrastructure
 * layer provides the concrete implementation (fake today, v5 API tomorrow).
 * This is the Dependency Inversion Principle in action.
 */
public interface ContractStorePort {

    MarketplaceContract fetch(String contractId, String version);
}
