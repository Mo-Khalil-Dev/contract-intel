package com.lbg.quarkus.client;

import com.lbg.quarkus.dto.GovernanceProduct;
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
 * Reactive REST client for the Governance / registration API.
 * Use the versions endpoint with response projection (returns the latest version).
 *
 * <p>Base URL from config: {@code quarkus.rest-client."governance".url}
 */
@RegisterRestClient(configKey = "governance")
public interface GovernanceClient {

    @GET
    @Path("/products/{id}/versions/latest")  // adjust to the real versions-endpoint path
    @Produces(MediaType.APPLICATION_JSON)
    @Timeout(5000)
    @CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.5, delay = 10_000)
    Uni<GovernanceProduct> getProduct(@PathParam("id") String contractId);
}
