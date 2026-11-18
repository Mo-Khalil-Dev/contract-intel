package com.lbg.quarkus.dto;

import com.lbg.quarkus.TestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** JSON -> typed event mapping (enums, Instant, nested error, unknown-field tolerance). */
class ContractStoreEventDtoTest {

    @Test
    void mapsJsonIncludingEnumsAndInstant() {
        ContractStoreEventDto e = TestFixtures.event("events/event-success.json");

        assertEquals("019a06d4-f80c-7160-b4b8-a93e65a1a02d", e.contractId());
        assertEquals(OperationType.DATACONTRACT_CREATED, e.operationType());
        assertEquals(EventStatus.SUCCESS, e.status());        // case-insensitive "Success"
        assertNotNull(e.eventTimestamp());                    // parsed Instant
        assertEquals("0.0.8", e.contractVersion());
    }

    @Test
    void mapsFailedEventWithErrorBlock() {
        ContractStoreEventDto e = TestFixtures.event("events/event-failed.json");

        assertEquals(EventStatus.FAILED, e.status());
        assertNotNull(e.error());
        assertEquals("500", e.error().httpStatus());
    }
}
