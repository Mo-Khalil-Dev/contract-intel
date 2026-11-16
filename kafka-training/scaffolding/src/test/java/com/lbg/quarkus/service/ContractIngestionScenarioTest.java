package com.lbg.quarkus.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder;
import com.lbg.quarkus.InjectWireMock;
import com.lbg.quarkus.WireMockResource;
import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.dto.MarketplaceRecord;
import com.lbg.quarkus.exception.ContractNotFoundException;
import com.lbg.quarkus.exception.InvalidEventException;
import com.lbg.quarkus.exception.TransientProcessingException;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Failure-scenario tests for the read + fetch stages, backed by WireMock.
 *
 * <p>Fault Tolerance is disabled in test config, so transient/not-found exceptions
 * propagate immediately (no retry backoff) and can be asserted directly.
 */
@QuarkusTest
@QuarkusTestResource(WireMockResource.class)
class ContractIngestionScenarioTest {

    @InjectWireMock
    WireMockServer wiremock;

    @Inject ContractIngestionService ingestionService;
    @Inject ContractFetchService fetchService;
    @Inject ObjectMapper mapper;

    private static final String CONTRACT_ID = "019a06d4-f80c-7160-b4b8-a93e65a1a02d";
    private static final String VERSION = "0.0.8";

    // ---------------------------------------------------------------- happy path

    @Test
    void happyPath_mergesBothSources() {
        stubContract(okJson(fixture("__files/contract-store-response.json")));
        stubGovernance(okJson(fixture("__files/governance-product.json")));

        MarketplaceRecord record = fetchService.buildRecord(CONTRACT_ID, VERSION)
                .await().atMost(Duration.ofSeconds(5));

        assertEquals(CONTRACT_ID, record.contractId());
        assertEquals("Example Data Product", record.dataProductName());   // from governance
        assertNotNull(record.schema());                                   // from contract store
        assertEquals("0.0.8", record.contractVersion());
    }

    // ---------------------------------------------------------------- event routing

    @Test
    void failedStatusEvent_isSkipped() {
        // no stubs: processing must skip BEFORE fetching
        assertDoesNotThrow(() -> ingestionService.process(event("events/event-failed.json")));
    }

    @Test
    void malformedEvent_throwsInvalid() {
        assertThrows(InvalidEventException.class,
                () -> ingestionService.process(event("events/event-malformed.json")));
    }

    // ---------------------------------------------------------------- fetch failures

    @Test
    void contractIdNotReturned_throwsNotFound() {
        stubContract(okJson(fixture("__files/contract-store-notfound.json")));
        stubGovernance(okJson(fixture("__files/governance-product.json")));

        assertThrows(ContractNotFoundException.class,
                () -> fetchService.buildRecord(CONTRACT_ID, VERSION).await().atMost(Duration.ofSeconds(5)));
    }

    @Test
    void contractStoreServerError_throwsTransient() {
        stubContract(serverError());
        stubGovernance(okJson(fixture("__files/governance-product.json")));

        assertThrows(TransientProcessingException.class,
                () -> fetchService.buildRecord(CONTRACT_ID, VERSION).await().atMost(Duration.ofSeconds(5)));
    }

    @Test
    void contractStoreHasError_throwsTransient() {
        // HTTP 200 but meta.hasError = true -> treat as transient
        stubContract(okJson("{\"meta\":{\"status\":500,\"hasError\":true,\"correlationId\":\"x\"},"
                + "\"response\":{\"data\":null}}"));
        stubGovernance(okJson(fixture("__files/governance-product.json")));

        assertThrows(TransientProcessingException.class,
                () -> fetchService.buildRecord(CONTRACT_ID, VERSION).await().atMost(Duration.ofSeconds(5)));
    }

    @Test
    void governanceUnavailable_recoversAndStillBuilds() {
        stubContract(okJson(fixture("__files/contract-store-response.json")));
        stubGovernance(notFound());                 // governance is optional -> recover to empty

        MarketplaceRecord record = fetchService.buildRecord(CONTRACT_ID, VERSION)
                .await().atMost(Duration.ofSeconds(5));

        assertEquals(CONTRACT_ID, record.contractId());   // still built from the contract alone
        assertNull(record.dataProductName());             // governance was empty
    }

    // ---------------------------------------------------------------- helpers

    private void stubContract(ResponseDefinitionBuilder response) {
        wiremock.stubFor(get(urlPathMatching("/contracts/.*")).willReturn(response));
    }

    private void stubGovernance(ResponseDefinitionBuilder response) {
        wiremock.stubFor(get(urlPathMatching("/products/.*")).willReturn(response));
    }

    private ContractStoreEventDto event(String path) {
        try (var in = cl().getResourceAsStream(path)) {
            return mapper.readValue(in, ContractStoreEventDto.class);
        } catch (Exception e) {
            throw new RuntimeException("failed to load event " + path, e);
        }
    }

    private String fixture(String path) {
        try (var in = cl().getResourceAsStream(path)) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("failed to load fixture " + path, e);
        }
    }

    private ClassLoader cl() {
        return Thread.currentThread().getContextClassLoader();
    }
}
