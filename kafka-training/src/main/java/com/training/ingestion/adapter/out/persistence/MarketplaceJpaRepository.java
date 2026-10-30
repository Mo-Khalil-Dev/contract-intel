package com.training.ingestion.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data repository for the JPA entity. An infrastructure detail, hidden behind the port. */
public interface MarketplaceJpaRepository extends JpaRepository<MarketplaceRecordEntity, String> {
}
