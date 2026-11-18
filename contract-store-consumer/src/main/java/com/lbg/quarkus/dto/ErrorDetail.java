package com.lbg.quarkus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Error block carried by the event when the upstream operation failed. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ErrorDetail(
        String httpStatus,
        String errorCategory,
        String sanitisedErrorMessage
) {
}
