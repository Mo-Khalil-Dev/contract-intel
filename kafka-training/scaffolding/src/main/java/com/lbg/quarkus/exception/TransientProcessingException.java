package com.lbg.quarkus.exception;

/**
 * Transient failure: a dependency (API / DB) was temporarily unavailable.
 * Listed in {@code @Retry(retryOn = ...)} so it is retried with backoff before the DLQ.
 */
public class TransientProcessingException extends RuntimeException {

    public TransientProcessingException(String message) {
        super(message);
    }

    public TransientProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
