package com.training.ingestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point. Run this class (green arrow in IntelliJ) to start the service.
 * Spring Boot wires everything together and starts the embedded web server + Kafka listeners.
 */
@SpringBootApplication
public class KafkaTrainingApplication {

    public static void main(String[] args) {
        SpringApplication.run(KafkaTrainingApplication.class, args);
    }
}
