package com.training.ingestion.adapter.in.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Watches the Dead Letter Topic so you can SEE failed messages. Another inbound adapter.
 */
@Component
public class DeadLetterListener {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterListener.class);

    @KafkaListener(topics = "${app.topic}.DLT", groupId = "dlt-monitor")
    public void onDeadLetter(ContractEventMessage message) {
        log.warn(">>> DLQ: a message could not be processed and landed here: {}", message);
    }
}
