package com.training.ingestion.adapter.out.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * JPA ENTITY — an INFRASTRUCTURE detail, NOT the domain model.
 *
 * Keeping this separate from the domain's MarketplaceContract means Hibernate/JPA
 * annotations never leak into the domain. The persistence adapter maps between the two.
 */
@Entity
@Table(name = "marketplace_records")
public class MarketplaceRecordEntity {

    @Id
    private String contractId;
    private String version;
    private String name;
    private String description;
    private Instant updatedAt;

    protected MarketplaceRecordEntity() {
        // JPA needs a no-arg constructor
    }

    public MarketplaceRecordEntity(String contractId, String version, String name,
                                   String description, Instant updatedAt) {
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
