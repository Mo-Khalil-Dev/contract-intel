package com.lbg.quarkus.service;

import com.lbg.quarkus.TestFixtures;
import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.dto.MarketplaceRecord;
import com.lbg.quarkus.exception.InvalidEventException;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Orchestration + routing: validate, status gate, delete handling, fetch dispatch. */
class ContractIngestionServiceTest {

    private EventValidator validator;
    private ContractFetchService fetchService;
    private ContractIngestionService service;

    @BeforeEach
    void setUp() {
        validator = Mockito.mock(EventValidator.class);
        fetchService = Mockito.mock(ContractFetchService.class);
        service = new ContractIngestionService();
        service.validator = validator;        // package-private injection
        service.fetchService = fetchService;
    }

    @Test
    void successEventIsValidatedAndFetched() {
        ContractStoreEventDto e = TestFixtures.event("events/event-success.json");
        when(fetchService.buildRecord(eq(e.contractId()), eq(e.contractVersion())))
                .thenReturn(Uni.createFrom().item(sampleRecord()));

        service.process(e);

        verify(validator).validate(e);
        verify(fetchService).buildRecord(e.contractId(), e.contractVersion());
    }

    @Test
    void failedStatusEventSkipsFetch() {
        ContractStoreEventDto e = TestFixtures.event("events/event-failed.json");

        service.process(e);

        verify(validator).validate(e);
        verifyNoInteractions(fetchService);
    }

    @Test
    void deleteEventSkipsFetch() {
        ContractStoreEventDto e = TestFixtures.event("events/event-delete.json");

        service.process(e);

        verifyNoInteractions(fetchService);
    }

    @Test
    void invalidEventPropagatesAndSkipsFetch() {
        ContractStoreEventDto e = TestFixtures.event("events/event-malformed.json");
        doThrow(new InvalidEventException("bad event")).when(validator).validate(any());

        assertThrows(InvalidEventException.class, () -> service.process(e));
        verifyNoInteractions(fetchService);
    }

    private MarketplaceRecord sampleRecord() {
        return new MarketplaceRecord("id", "1", "name", "desc", "Origin", List.of(),
                "BA", "Active", List.of(), "Internal", "Daily", "instructions", "Active",
                List.of(), "sig");
    }
}
