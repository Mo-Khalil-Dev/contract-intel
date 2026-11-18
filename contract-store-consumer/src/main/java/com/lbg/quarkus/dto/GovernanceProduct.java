package com.lbg.quarkus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Governance / registration API model — the product fields the Marketplace loads.
 * Fetch these via the versions endpoint with response projection (latest version).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GovernanceProduct(
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
        String status
) {

    /** Used when governance is optional and the call is recovered (e.g. 404). */
    public static GovernanceProduct empty() {
        return new GovernanceProduct(null, null, null, List.of(), null, null,
                List.of(), null, null, null, null);
    }
}
