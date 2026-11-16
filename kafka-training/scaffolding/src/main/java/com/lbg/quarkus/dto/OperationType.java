package com.lbg.quarkus.dto;

/** The kind of change the event represents. Confirm the full set with the producer team. */
public enum OperationType {
    DATACONTRACT_CREATED,
    DATACONTRACT_UPDATED,
    DATACONTRACT_DELETED
}
