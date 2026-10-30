package com.training.ingestion.domain.model;

import java.time.Instant;

/**
 * DOMAIN aggregate: a contract as the Marketplace understands it.
 *
 * Pure Java — NO JPA, NO Spring, NO Kafka. This is the centre of the application;
 * by the Clean Architecture dependency rule, every other layer points inward toward
 * this, and it points at nothing. That is what keeps the core testable and stable
 * while the outside (Kafka, HTTP, database) is free to change.
 */
public class MarketplaceContract {

    private final String contractId;
    private final String version;
    private final String name;
    private final String description;
    private final Instant updatedAt;

    private MarketplaceContract(String contractId, String version, String name,
                                String description, Instant updatedAt) {
        this.contractId = contractId;
        this.version = version;
        this.name = name;
        this.description = description;
        this.updatedAt = updatedAt;
    }

    /** Factory in the ubiquitous language: we "create" a marketplace contract. */
    public static MarketplaceContract create(String contractId, String version,
                                             String name, String description) {
        return new MarketplaceContract(contractId, version, name, description, Instant.now());
    }

    public String contractId() { return contractId; }
    public String version() { return version; }
    public String name() { return name; }
    public String description() { return description; }
    public Instant updatedAt() { return updatedAt; }
}
