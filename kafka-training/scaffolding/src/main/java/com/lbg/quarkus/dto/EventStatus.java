package com.lbg.quarkus.dto;

/**
 * Upstream operation status carried by the event.
 * The producer sends "Success" / "FAILED" (mixed case) — enable
 * {@code quarkus.jackson.accept-case-insensitive-enums=true}.
 */
public enum EventStatus {
    SUCCESS,
    FAILED
}
