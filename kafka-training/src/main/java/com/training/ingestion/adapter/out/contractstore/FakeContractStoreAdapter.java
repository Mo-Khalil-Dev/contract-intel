package com.training.ingestion.adapter.out.contractstore;

import com.training.ingestion.domain.model.MarketplaceContract;
import com.training.ingestion.domain.port.out.ContractStorePort;
import org.springframework.stereotype.Component;

/**
 * OUTBOUND (driven) ADAPTER implementing ContractStorePort.
 *
 * In the real service this calls the Contract Store v5 REST API and maps the API's
 * response into the domain's MarketplaceContract. Here it fabricates one. Because the
 * application depends on the PORT, swapping this for a RealContractStoreAdapter needs
 * zero changes to the application or domain.
 */
@Component
public class FakeContractStoreAdapter implements ContractStorePort {

    @Override
    public MarketplaceContract fetch(String contractId, String version) {
        return MarketplaceContract.create(
                contractId,
                version,
                "Contract " + contractId,
                "Full description fetched from the (fake) v5 API for " + contractId + " v" + version
        );
    }
}
