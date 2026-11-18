package com.lbg.quarkus.dto;

/**
 * The handful of fields we actually use from an event to drive the pipeline.
 *
 * <p>The event is a trigger; the authoritative data comes from the APIs. Everything
 * downstream keys off {@code contractId}, gates on {@code status}, routes on
 * {@code operationType}, guards on {@code contractVersion}, and traces via
 * {@code correlationId}.
 */
public record EventTrigger(
        String contractId,
        String contractVersion,
        OperationType operationType,
        EventStatus status,
        String correlationId
) {

    public static EventTrigger from(ContractStoreEventDto e) {
        return new EventTrigger(
                e.contractId(),
                e.contractVersion(),
                e.operationType(),
                e.status(),
                e.correlationId());
    }

    /** Should we fetch + ingest this event? (successful, non-delete) */
    public boolean isIngestable() {
        return status == EventStatus.SUCCESS
                && operationType != OperationType.DATACONTRACT_DELETED;
    }

    public boolean isDelete() {
        return operationType == OperationType.DATACONTRACT_DELETED;
    }
}
