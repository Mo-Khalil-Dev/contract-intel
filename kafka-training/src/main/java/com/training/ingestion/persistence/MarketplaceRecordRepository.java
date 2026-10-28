package com.training.ingestion.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data gives us save()/findById()/count() for free — no SQL to write.
 * save() does the idempotent upsert: insert if new, update if the id already exists.
 */
public interface MarketplaceRecordRepository extends JpaRepository<MarketplaceRecord, String> {
}
