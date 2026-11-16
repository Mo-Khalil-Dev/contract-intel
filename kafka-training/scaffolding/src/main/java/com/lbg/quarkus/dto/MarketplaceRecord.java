package com.lbg.quarkus.dto;

import java.util.List;

/**
 * The merged record: Governance product metadata + Contract Store technical schema.
 * This is what gets embedded and upserted into the Marketplace (Phase 4).
 *
 * <p>(A matching Panache entity is added in Phase 4 — this is the domain shape.)
 */
public record MarketplaceRecord(
        String contractId,
        String contractVersion,
        // ---- from Governance (authoritative for product metadata) ----
        String dataProductName,
        String description,
        String dataProductType,
        List<String> dataProductOwners,
        String owningBusinessArea,
        String productLifeCycleStage,
        List<String> relatedToGDMDataConcepts,
        String securityClassification,
        String dataUpdateFrequency,
        String accessInstructions,
        String status,
        // ---- from Contract Store (technical schema + integrity) ----
        List<ContractStoreResponse.SchemaObject> schema,
        String signature
) {
}
