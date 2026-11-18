package com.lbg.quarkus.dto;

import com.lbg.quarkus.TestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Extraction of the fields the pipeline actually uses + routing helpers. */
class EventTriggerTest {

    @Test
    void extractsFieldsFromSuccessEvent() {
        ContractStoreEventDto e = TestFixtures.event("events/event-success.json");
        EventTrigger t = EventTrigger.from(e);

        assertEquals(e.contractId(), t.contractId());
        assertEquals(e.contractVersion(), t.contractVersion());
        assertEquals(e.correlationId(), t.correlationId());
        assertTrue(t.isIngestable());
        assertFalse(t.isDelete());
    }

    @Test
    void failedStatusIsNotIngestable() {
        EventTrigger t = EventTrigger.from(TestFixtures.event("events/event-failed.json"));
        assertFalse(t.isIngestable());
    }

    @Test
    void deleteIsDetectedAndNotIngestable() {
        EventTrigger t = new EventTrigger("id", "1",
                OperationType.DATACONTRACT_DELETED, EventStatus.SUCCESS, "corr");
        assertTrue(t.isDelete());
        assertFalse(t.isIngestable());
    }
}
