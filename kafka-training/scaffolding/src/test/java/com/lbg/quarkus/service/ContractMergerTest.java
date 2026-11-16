package com.lbg.quarkus.service;

import com.lbg.quarkus.TestFixtures;
import com.lbg.quarkus.dto.ContractStoreResponse;
import com.lbg.quarkus.dto.GovernanceProduct;
import com.lbg.quarkus.dto.MarketplaceRecord;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Pure merge logic: governance metadata + contract schema, with fallbacks. */
class ContractMergerTest {

    private final ContractMerger merger = new ContractMerger();

    @Test
    void mergesGovernanceMetadataAndContractSchema() {
        ContractStoreResponse c = TestFixtures.contractResponse("__files/contract-store-response.json");
        GovernanceProduct g = TestFixtures.governance("__files/governance-product.json");

        MarketplaceRecord r = merger.merge("0.0.7", c, g);

        assertEquals("019a06d4-f80c-7160-b4b8-a93e65a1a02d", r.contractId());
        assertEquals("0.0.8", r.contractVersion());             // contract version wins over event
        assertEquals("Example Data Product", r.dataProductName()); // from governance
        assertEquals("Internal", r.securityClassification());   // from governance
        assertNotNull(r.schema());                              // from contract store
        assertFalse(r.schema().isEmpty());
        assertNotNull(r.signature());
    }

    @Test
    void fallsBackToContractWhenGovernanceEmpty() {
        ContractStoreResponse c = TestFixtures.contractResponse("__files/contract-store-response.json");

        MarketplaceRecord r = merger.merge("0.0.8", c, GovernanceProduct.empty());

        assertNull(r.dataProductName());                                        // governance empty
        assertEquals("Example purpose text for the data product.", r.description()); // contract purpose
        assertEquals("Active", r.status());                                    // contract status
    }

    @Test
    void usesEventVersionWhenContractVersionNull() {
        var data = new ContractStoreResponse.Data("id-3", null, "v3", "DataContract",
                "prod", "domain", "Active", null, java.util.List.of(), java.util.List.of(), "ts", "sig");
        var c = new ContractStoreResponse(
                new ContractStoreResponse.Meta(200, false, "corr", 1L),
                new ContractStoreResponse.Response(data));

        MarketplaceRecord r = merger.merge("9.9.9", c, GovernanceProduct.empty());

        assertEquals("9.9.9", r.contractVersion());
    }
}
