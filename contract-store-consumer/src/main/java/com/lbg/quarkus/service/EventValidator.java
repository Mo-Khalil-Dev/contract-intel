package com.lbg.quarkus.service;

import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.exception.InvalidEventException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Validates an incoming event against its Bean Validation constraints.
 * Any violation is a permanent (data) failure → {@link InvalidEventException} → DLQ.
 */
@ApplicationScoped
public class EventValidator {

    @Inject
    Validator validator;

    public void validate(ContractStoreEventDto event) {
        Set<ConstraintViolation<ContractStoreEventDto>> violations = validator.validate(event);
        if (!violations.isEmpty()) {
            String detail = violations.stream()
                    .map(v -> v.getPropertyPath() + " " + v.getMessage())
                    .collect(Collectors.joining("; "));
            throw new InvalidEventException("Invalid contract event: " + detail);
        }
    }
}
