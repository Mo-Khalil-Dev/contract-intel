package com.lbg.quarkus.messaging;

import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.service.ContractIngestionService;
import io.quarkus.logging.Log;
import io.smallrye.common.annotation.Blocking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Acknowledgment;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.reactive.messaging.Message;
import org.jboss.logmanager.MDC;

import java.util.concurrent.CompletionStage;

/**
 * Consumes contract-store events with MANUAL acknowledgement.
 *
 * <ul>
 *   <li>{@code @Blocking} — runs on a worker thread (the pipeline does blocking REST + JDBC).
 *   <li>{@code @Acknowledgment(MANUAL)} — we {@code ack()} only AFTER success, {@code nack()} on failure.
 *   <li>On {@code nack}, the configured {@code failure-strategy=dead-letter-queue} publishes
 *       the record to the DLT. The offset only advances once a message is acked
 *       (commit-strategy = throttled; auto-commit disabled).
 * </ul>
 */
@ApplicationScoped
public class ContractStoreEventListener {

    public static final String CHANNEL = "contract-store-events";

    @Inject
    ContractIngestionService service;

    @Incoming(CHANNEL)
    @Blocking
    @Acknowledgment(Acknowledgment.Strategy.MANUAL)
    public CompletionStage<Void> consume(Message<ContractStoreEventDto> message) {
        ContractStoreEventDto event = message.getPayload();

        // correlation id into MDC so every log line for this event is traceable
        MDC.put("correlationId", event.correlationId());
        MDC.put("contractId", event.contractId());
        try {
            service.process(event);        // validate + extract + (phase 3) fetch/merge
            return message.ack();          // success → offset will be committed
        } catch (Exception e) {
            Log.errorf(e, "Processing failed for contract %s", event.contractId());
            return message.nack(e);        // failure → DLQ (after retries are exhausted)
        } finally {
            MDC.clear();                   // worker threads are reused — always clear
        }
    }
}
