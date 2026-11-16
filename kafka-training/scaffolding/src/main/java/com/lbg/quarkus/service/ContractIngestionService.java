package com.lbg.quarkus.service;

import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.dto.EventStatus;
import com.lbg.quarkus.dto.EventTrigger;
import com.lbg.quarkus.exception.InvalidEventException;
import com.lbg.quarkus.exception.TransientProcessingException;
import io.quarkus.logging.Log;
import io.smallrye.faulttolerance.api.ExponentialBackoff;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.faulttolerance.Retry;

import java.time.temporal.ChronoUnit;

/**
 * Orchestrates processing of one event.
 *
 * <p>Resilience: retry TRANSIENT failures (API/DB blips) with exponential backoff;
 * abort PERMANENT failures (bad data) straight to the DLQ. When retries are exhausted
 * the exception propagates to the listener, which nacks → DLQ.
 */
@ApplicationScoped
public class ContractIngestionService {

    @Inject
    EventValidator validator;

    // Phase 3: inject the fetch/merge service (two concurrent API calls -> merged record)
    // @Inject ContractFetchService fetchService;

    // Phase 4: inject the repository (idempotent upsert with version guard)
    // @Inject MarketplaceRepository repository;

    @Retry(maxRetries = 4, delay = 1, delayUnit = ChronoUnit.SECONDS,
            retryOn = TransientProcessingException.class,
            abortOn = InvalidEventException.class)
    @ExponentialBackoff(factor = 2, maxDelay = 10_000)   // 1s -> 2s -> 4s -> 8s (cap 10s)
    public void process(ContractStoreEventDto event) {

        // 1. VALIDATE (permanent failure -> DLQ, no retry)
        validator.validate(event);

        // 2. EXTRACT the fields we actually use
        EventTrigger trigger = EventTrigger.from(event);

        // 3. GATE on status: an upstream (Collibra) failure is NOT our failure — skip it
        if (trigger.status() != EventStatus.SUCCESS) {
            Log.infof("Skipping non-success event for contract %s (status=%s)",
                    trigger.contractId(), trigger.status());
            return;
        }

        // 4. DELETE semantics (decide with the team: remove vs tombstone)
        if (trigger.isDelete()) {
            Log.infof("Delete event for contract %s — TODO delete/tombstone", trigger.contractId());
            return;
        }

        // 5. PHASE 3 — fetch Contract Store + Governance concurrently, then merge:
        //    MarketplaceRecord record = fetchService.buildRecord(trigger.contractId())
        //                                           .await().atMost(Duration.ofSeconds(30));

        // 6. PHASE 4 — idempotent upsert with version guard:
        //    repository.upsert(record, trigger.contractVersion());

        Log.infof("Processed contract %s version %s (%s)",
                trigger.contractId(), trigger.contractVersion(), trigger.operationType());
    }
}
