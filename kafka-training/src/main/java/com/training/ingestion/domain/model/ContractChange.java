package com.training.ingestion.domain.model;

/**
 * DOMAIN model: the meaning of "a contract changed", independent of Kafka or JSON.
 *
 * This lives in the DOMAIN layer and knows nothing about any framework. The inbound
 * Kafka adapter translates the wire message into this. Ubiquitous language: we speak
 * of a "contract change", not a "Kafka message", once we're inside the domain.
 */
public record ContractChange(String contractId, String version, String changeType) {

    /** A business rule expressed in the domain: some change types can't be processed. */
    public boolean isPoison() {
        return "POISON".equalsIgnoreCase(changeType);
    }
}
