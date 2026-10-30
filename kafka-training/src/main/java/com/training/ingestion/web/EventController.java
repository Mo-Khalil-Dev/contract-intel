package com.training.ingestion.web;

import com.training.ingestion.adapter.in.kafka.ContractEventMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A tiny REST endpoint so YOU can publish test events (standing in for the Contract
 * Store producer). It publishes the wire DTO (ContractEventMessage) to the topic.
 *
 * Normal event:
 *   curl -X POST localhost:8090/events -H "Content-Type: application/json" \
 *        -d '{"contractId":"C-001","version":"1","eventType":"contract.updated"}'
 * Poison event (to see the DLQ):
 *   curl -X POST localhost:8090/events -H "Content-Type: application/json" \
 *        -d '{"contractId":"C-666","version":"1","eventType":"POISON"}'
 */
@RestController
@RequestMapping("/events")
public class EventController {

    private final KafkaTemplate<String, Object> template;
    private final String topic;

    public EventController(KafkaTemplate<String, Object> template,
                           @Value("${app.topic}") String topic) {
        this.template = template;
        this.topic = topic;
    }

    @PostMapping
    public String publish(@RequestBody ContractEventMessage event) {
        template.send(topic, event.contractId(), event);
        return "Published: " + event + "\n";
    }
}
