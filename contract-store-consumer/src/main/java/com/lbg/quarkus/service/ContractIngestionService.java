package com.lbg.quarkus.service;

import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.dto.EventStatus;
import com.lbg.quarkus.dto.EventTrigger;
import com.lbg.quarkus.dto.MarketplaceRecord;
import com.lbg.quarkus.exception.ContractNotFoundException;
import com.lbg.quarkus.exception.InvalidEventException;
import com.lbg.quarkus.exception.TransientProcessingException;
import io.quarkus.logging.Log;
import io.smallrye.faulttolerance.api.ExponentialBackoff;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.faulttolerance.Retry;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

/**
 * Orchestrates processing of one event: validate → extract → fetch+merge → (phase 4) upsert.
 *
 * <p>Resilience: retry TRANSIENT failures (API/DB blips) with exponential backoff;
 * abort PERMANENT failures (bad data) straight to the DLQ. When retries are exhausted
 * the exception propagates to the listener, which nacks → DLQ.
 */
@ApplicationScoped
public class ContractIngestionService {

    @Inject
    EventValidator validator;

    @Inject
    ContractFetchService fetchService;

    // Phase 4: inject the repository (idempotent upsert with version guard)
    // @Inject MarketplaceRepository repository;

    @Retry(maxRetries = 4, delay = 1, delayUnit = ChronoUnit.SECONDS,
            // ContractNotFoundException = short retry for a consistency race, then DLQ (DECIDE vs delete)
            retryOn = {TransientProcessingException.class, ContractNotFoundException.class},
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

        // 5. FETCH Contract Store + Governance concurrently, then merge.
        //    .await() is safe here: @Blocking put us on a worker thread.
        MarketplaceRecord record = fetchService
                .buildRecord(trigger.contractId(), trigger.contractVersion())
                .await().atMost(Duration.ofSeconds(30));

        // 6. PHASE 4 — idempotent upsert with version guard:
        //    repository.upsert(record, trigger.contractVersion());

        Log.infof("Built marketplace record for contract %s version %s (%s)",
                record.contractId(), record.contractVersion(), trigger.operationType());
    }
}
