package com.training.ingestion.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One row in the "Marketplace table" (the right-hand side of the HLD).
 *
 * The primary key is contractId. That is what makes our upsert IDEMPOTENT:
 * processing the same contract twice overwrites the same row instead of
 * inserting a duplicate (GOLDEN RULE 2).
 */
@Entity
@Table(name = "marketplace_records")
public class MarketplaceRecord {

    @Id
    private String contractId;
    private String version;
    private String name;
    private String description;
    private Instant updatedAt;

    protected MarketplaceRecord() {
        // JPA needs a no-arg constructor
    }

    public MarketplaceRecord(String contractId, String version, String name, String description, Instant updatedAt) {
        this.contractId = contractId;
        this.version = version;
        this.name = name;
        this.description = description;
        this.updatedAt = updatedAt;
    }

    public String getContractId() { return contractId; }
    public String getVersion() { return version; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Instant getUpdatedAt() { return updatedAt; }
}
