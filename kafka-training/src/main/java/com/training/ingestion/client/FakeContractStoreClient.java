package com.training.ingestion.client;

import org.springframework.stereotype.Component;

/**
 * Stand-in for the real Contract Store v5 REST API call:  GET /v5/contracts/{id}
 *
 * In the real service this is where you'd use a WebClient/RestClient to fetch the
 * FULL contract definition. Here we just fabricate one so you can run the flow
 * end-to-end with no external system.
 *
 * This represents the "Contract Store v5 API Client" box in the HLD diagram.
 */
@Component
public class FakeContractStoreClient {

    public FullContract fetch(String contractId, String version) {
        // Pretend we just called the API and got back the full record.
        return new FullContract(
                contractId,
                version,
                "Contract " + contractId,
                "Full description fetched from the (fake) v5 API for " + contractId + " v" + version
        );
    }

    /** The richer object the API would return (vs the tiny event). */
    public record FullContract(String contractId, String version, String name, String description) {
    }
}
