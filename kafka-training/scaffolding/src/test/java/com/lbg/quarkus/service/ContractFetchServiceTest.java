package com.lbg.quarkus.service;

import com.lbg.quarkus.TestFixtures;
import com.lbg.quarkus.client.ContractStoreClient;
import com.lbg.quarkus.client.GovernanceClient;
import com.lbg.quarkus.dto.ContractStoreResponse;
import com.lbg.quarkus.dto.GovernanceProduct;
import com.lbg.quarkus.dto.MarketplaceRecord;
import com.lbg.quarkus.exception.ContractNotFoundException;
import com.lbg.quarkus.exception.TransientProcessingException;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/** Concurrent fetch + merge, and each failure branch. Clients are mocked (no HTTP). */
class ContractFetchServiceTest {

    private static final String CID = "019a06d4-f80c-7160-b4b8-a93e65a1a02d";
    private static final String VERSION = "0.0.8";

    private ContractStoreClient contractStoreClient;
    private GovernanceClient governanceClient;
    private ContractFetchService service;

    @BeforeEach
    void setUp() {
        contractStoreClient = Mockito.mock(ContractStoreClient.class);
        governanceClient = Mockito.mock(GovernanceClient.class);
        service = new ContractFetchService();
        service.contractStoreClient = contractStoreClient;   // package-private injection
        service.governanceClient = governanceClient;
        service.merger = new ContractMerger();
    }

    @Test
    void buildsRecordFromBothSources() {
        when(contractStoreClient.getContract(any())).thenReturn(Uni.createFrom()
                .item(TestFixtures.contractResponse("__files/contract-store-response.json")));
        when(governanceClient.getProduct(any())).thenReturn(Uni.createFrom()
                .item(TestFixtures.governance("__files/governance-product.json")));

        MarketplaceRecord r = service.buildRecord(CID, VERSION).await().atMost(Duration.ofSeconds(2));

        assertEquals(CID, r.contractId());
        assertEquals("Example Data Product", r.dataProductName());
    }

    @Test
    void contractIdNotReturnedThrowsNotFound() {
        when(contractStoreClient.getContract(any())).thenReturn(Uni.createFrom()
                .item(TestFixtures.contractResponse("__files/contract-store-notfound.json")));
        when(governanceClient.getProduct(any())).thenReturn(Uni.createFrom().item(GovernanceProduct.empty()));

        assertThrows(ContractNotFoundException.class,
                () -> service.buildRecord(CID, VERSION).await().atMost(Duration.ofSeconds(2)));
    }

    @Test
    void contractStoreFailureThrowsTransient() {
        when(contractStoreClient.getContract(any()))
                .thenReturn(Uni.createFrom().failure(new RuntimeException("boom")));
        when(governanceClient.getProduct(any())).thenReturn(Uni.createFrom().item(GovernanceProduct.empty()));

        assertThrows(TransientProcessingException.class,
                () -> service.buildRecord(CID, VERSION).await().atMost(Duration.ofSeconds(2)));
    }

    @Test
    void contractStoreHasErrorThrowsTransient() {
        var errorResponse = new ContractStoreResponse(
                new ContractStoreResponse.Meta(500, true, "corr", 1L),
                new ContractStoreResponse.Response(null));
        when(contractStoreClient.getContract(any())).thenReturn(Uni.createFrom().item(errorResponse));
        when(governanceClient.getProduct(any())).thenReturn(Uni.createFrom().item(GovernanceProduct.empty()));

        assertThrows(TransientProcessingException.class,
                () -> service.buildRecord(CID, VERSION).await().atMost(Duration.ofSeconds(2)));
    }

    @Test
    void governanceFailureIsRecoveredAndRecordStillBuilt() {
        when(contractStoreClient.getContract(any())).thenReturn(Uni.createFrom()
                .item(TestFixtures.contractResponse("__files/contract-store-response.json")));
        when(governanceClient.getProduct(any()))
                .thenReturn(Uni.createFrom().failure(new RuntimeException("governance down")));

        MarketplaceRecord r = service.buildRecord(CID, VERSION).await().atMost(Duration.ofSeconds(2));

        assertEquals(CID, r.contractId());         // built from the contract alone
        assertNull(r.dataProductName());           // governance recovered to empty
    }
}
