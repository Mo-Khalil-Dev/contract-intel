package com.lbg.quarkus.client;

import com.lbg.quarkus.dto.ContractStoreResponse;
import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.faulttolerance.CircuitBreaker;
import org.eclipse.microprofile.faulttolerance.Timeout;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

/**
 * Reactive REST client for the Contract Store API.
 * Returns {@code Uni} so two calls can run concurrently (see ContractFetchService).
 * Resilience lives here: timeout + circuit breaker to stop hammering a struggling API.
 *
 * <p>Base URL from config: {@code quarkus.rest-client."contract-store".url}
 */
@RegisterRestClient(configKey = "contract-store")
public interface ContractStoreClient {

    @GET
    @Path("/contracts/{id}")                 // adjust to the real path
    @Produces(MediaType.APPLICATION_JSON)
    @Timeout(5000)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10_000)
    Uni<ContractStoreResponse> getContract(@PathParam("id") String contractId);
}
