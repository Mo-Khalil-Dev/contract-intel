package com.lbg.quarkus.exception;

/**
 * Permanent failure: the event is invalid and will never succeed.
 * Listed in {@code @Retry(abortOn = ...)} so it is NOT retried and goes straight to the DLQ.
 */
public class InvalidEventException extends RuntimeException {
    public InvalidEventException(String message) {
        super(message);
    }
}
