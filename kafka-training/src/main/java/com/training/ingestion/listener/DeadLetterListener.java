package com.training.ingestion.listener;

import com.training.ingestion.event.ContractEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Watches the Dead Letter Topic. When a message fails processing too many times,
 * Spring republishes it to "<topic>.DLT". In a real service a human (or an alert)
 * would investigate these. Here we just log them so you can SEE the DLQ working.
 */
@Component
public class DeadLetterListener {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterListener.class);

    @KafkaListener(topics = "${app.topic}.DLT", groupId = "dlt-monitor")
    public void onDeadLetter(ContractEvent event) {
        log.warn(">>> DLQ: a message could not be processed and landed here: {}", event);
    }
}
