package com.lbg.quarkus.service;

import com.lbg.quarkus.dto.ContractStoreResponse;
import com.lbg.quarkus.dto.GovernanceProduct;
import com.lbg.quarkus.dto.MarketplaceRecord;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Pure merge of the two API responses into the Marketplace record.
 *
 * <p>Provenance (confirm the overlaps with the team):
 * <ul>
 *   <li>Governance = authoritative for product metadata (owners, business area, lifecycle…)
 *   <li>Contract Store = technical schema + identity + integrity (signature)
 *   <li>Overlaps (description, status) — governance wins, falling back to the contract
 * </ul>
 */
@ApplicationScoped
public class ContractMerger {

    public MarketplaceRecord merge(String eventContractVersion,
                                   ContractStoreResponse contract,
                                   GovernanceProduct gov) {

        ContractStoreResponse.Data data = contract.data();
        String contractVersion = (data != null && data.version() != null)
                ? data.version() : eventContractVersion;

        return new MarketplaceRecord(
                data != null ? data.id() : null,
                contractVersion,
                gov.dataProductName(),
                gov.description() != null ? gov.description() : purpose(data),
                gov.dataProductType(),
                gov.dataProductOwners(),
                gov.owningBusinessArea(),
                gov.productLifeCycleStage(),
                gov.relatedToGDMDataConcepts(),
                gov.securityClassification(),
                gov.dataUpdateFrequency(),
                gov.accessInstructions(),
                gov.status() != null ? gov.status() : (data != null ? data.status() : null),
                data != null ? data.schema() : null,
                data != null ? data.signature() : null);
    }

    private String purpose(ContractStoreResponse.Data data) {
        return (data != null && data.description() != null) ? data.description().purpose() : null;
    }
}
