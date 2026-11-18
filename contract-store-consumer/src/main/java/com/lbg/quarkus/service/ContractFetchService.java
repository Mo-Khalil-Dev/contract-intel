package com.lbg.quarkus.service;

import com.lbg.quarkus.client.ContractStoreClient;
import com.lbg.quarkus.client.GovernanceClient;
import com.lbg.quarkus.dto.ContractStoreResponse;
import com.lbg.quarkus.dto.GovernanceProduct;
import com.lbg.quarkus.dto.MarketplaceRecord;
import com.lbg.quarkus.exception.ContractNotFoundException;
import com.lbg.quarkus.exception.TransientProcessingException;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

/**
 * Fetches the Contract Store and Governance responses CONCURRENTLY and merges them.
 *
 * <p>Both calls fire in parallel ({@code Uni.combine().all()}); the merge runs when both
 * complete. A fetch failure becomes a {@link TransientProcessingException} so the service's
 * {@code @Retry} retries it; governance is treated as optional and recovered to empty
 * (confirm this policy with the team).
 */
@ApplicationScoped
public class ContractFetchService {

    @Inject
    @RestClient
    ContractStoreClient contractStoreClient;

    @Inject
    @RestClient
    GovernanceClient governanceClient;

    @Inject
    ContractMerger merger;

    public Uni<MarketplaceRecord> buildRecord(String contractId, String eventContractVersion) {

        Uni<ContractStoreResponse> contract = contractStoreClient.getContract(contractId)
                .onFailure().transform(t ->
                        new TransientProcessingException("contract-store fetch failed for " + contractId, t));

        Uni<GovernanceProduct> governance = governanceClient.getProduct(contractId)
                .onFailure().recoverWithItem(GovernanceProduct::empty);   // optional — decide with team

        return Uni.combine().all().unis(contract, governance)
                .combinedWith((c, g) -> {
                    if (!c.ok()) {
                        throw new TransientProcessingException(
                                "contract-store returned an error for " + contractId);
                    }
                    // the contract id was NOT returned (empty/null data) — not-found scenario
                    if (c.data() == null || c.data().id() == null) {
                        throw new ContractNotFoundException(
                                "contract-store did not return contract " + contractId);
                    }
                    return merger.merge(eventContractVersion, c, g);
                });
    }
}
