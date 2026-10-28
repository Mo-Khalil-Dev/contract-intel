package com.training.ingestion.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Two things set up here:
 *  1. The topics get created automatically on startup.
 *  2. The error handling / DLQ behaviour (GOLDEN RULE 3: fail to DLQ, don't block).
 */
@Configuration
public class KafkaConfig {

    // Create the main topic and its dead-letter topic on startup.
    @Bean
    public NewTopic contractEventsTopic(@Value("${app.topic}") String topic) {
        return TopicBuilder.name(topic).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic contractEventsDltTopic(@Value("${app.topic}") String topic) {
        return TopicBuilder.name(topic + ".DLT").partitions(1).replicas(1).build();
    }

    /**
     * When a listener throws, retry twice (1 second apart). If it STILL fails,
     * publish the message to "<topic>.DLT" and move on so the stream isn't blocked.
     */
    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> template) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template);
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2L));
    }
}
