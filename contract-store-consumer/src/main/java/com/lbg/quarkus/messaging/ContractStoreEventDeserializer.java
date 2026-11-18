package com.lbg.quarkus.messaging;

import com.lbg.quarkus.dto.ContractStoreEventDto;
import io.quarkus.kafka.client.serialization.ObjectMapperDeserializer;

/**
 * Deserializes the Kafka value (JSON) straight into the typed event, so the
 * {@code @Incoming} method receives a {@link ContractStoreEventDto} rather than a String.
 *
 * <p>Un-parseable bytes fail here; with
 * {@code fail-on-deserialization-failure=false} + {@code failure-strategy=dead-letter-queue}
 * the bad record is routed to the DLQ (it cannot be retried).
 */
public class ContractStoreEventDeserializer extends ObjectMapperDeserializer<ContractStoreEventDto> {
    public ContractStoreEventDeserializer() {
        super(ContractStoreEventDto.class);
    }
}
