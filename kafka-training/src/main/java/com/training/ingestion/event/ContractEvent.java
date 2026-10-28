package com.training.ingestion.event;

/**
 * The event that arrives on the Kafka topic.
 *
 * GOLDEN RULE 1 ("event = trigger, API = truth"): notice how small this is.
 * It carries only identifiers, NOT the full contract. The real data is fetched
 * afterwards from the Contract Store v5 API (see FakeContractStoreClient).
 *
 * eventType values we support in this practice app:
 *   - "contract.created" / "contract.updated"  -> normal, gets processed
 *   - "POISON"                                 -> deliberately fails, to demo the DLQ
 */
public record ContractEvent(
        String contractId,
        String version,
        String eventType
) {
}
