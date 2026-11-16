package com.lbg.quarkus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.lbg.quarkus.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.Instant;

/**
 * Typed, validated model of a contract-store change event (the trigger on the topic).
 *
 * <p>Unknown fields are ignored so new producer fields don't break us (forward-compatible).
 * The event is only a trigger: the authoritative data is fetched from the APIs afterwards.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ContractStoreEventDto(

        @NotBlank
        @Pattern(regexp = ValidationPatterns.UUID_REGEX, message = "eventId must be a UUID")
        String eventId,

        @NotNull(message = "operationType is required")
        OperationType operationType,

        @NotBlank(message = "version is required")
        String version,                 // event/schema version, e.g. "4.0"

        @NotBlank
        @Pattern(regexp = ValidationPatterns.UUID_REGEX, message = "contractId must be a UUID")
        String contractId,

        @NotNull(message = "eventTimestamp is required")
        Instant eventTimestamp,

        @NotBlank(message = "source is required")
        String source,

        @NotBlank(message = "correlationId is required")
        String correlationId,

        @NotBlank(message = "contractVersion is required")
        String contractVersion,         // the CONTRACT's version, e.g. "0.0.8"

        @NotNull(message = "status is required")
        EventStatus status,

        String userId,
        String collibraAssetId,

        @Valid ErrorDetail error,       // populated when status = FAILED
        String message
) {
}
