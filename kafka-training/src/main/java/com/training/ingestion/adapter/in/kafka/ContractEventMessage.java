package com.training.ingestion.adapter.in.kafka;

/**
 * The WIRE shape of the event as it arrives on Kafka (a DTO for the inbound adapter).
 *
 * It is deliberately SEPARATE from the domain's ContractChange. The adapter's job is
 * to translate the outside world's shape into the domain's language — so if the wire
 * format changes, only this DTO and the adapter change, never the domain.
 */
public record ContractEventMessage(String contractId, String version, String eventType) {
}
