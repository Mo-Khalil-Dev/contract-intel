package com.training.ingestion.web;

import com.training.ingestion.event.ContractEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A tiny REST endpoint so YOU can publish test events (acting as the Contract Store
 * producer). In real life the Contract Store publishes these, not you.
 *
 * Publish a normal event:
 *   curl -X POST localhost:8090/events -H "Content-Type: application/json" \
 *        -d '{"contractId":"C-001","version":"1","eventType":"contract.updated"}'
 *
 * Publish a poison event (to see the DLQ):
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
    public String publish(@RequestBody ContractEvent event) {
        // Key the message by contractId so all events for one contract keep their order.
        template.send(topic, event.contractId(), event);
        return "Published: " + event + "\n";
    }
}
