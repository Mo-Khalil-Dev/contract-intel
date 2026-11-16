package com.lbg.quarkus.service;

import com.lbg.quarkus.TestFixtures;
import com.lbg.quarkus.exception.InvalidEventException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Bean Validation wrapper: valid events pass, invalid events throw with the offending field. */
class EventValidatorTest {

    private EventValidator eventValidator;

    @BeforeEach
    void setUp() {
        Validator validator = Validation.byDefaultProvider().configure()
                .messageInterpolator(new ParameterMessageInterpolator())  // no EL needed in unit tests
                .buildValidatorFactory().getValidator();
        eventValidator = new EventValidator();
        eventValidator.validator = validator;   // package-private field injection
    }

    @Test
    void validEventPasses() {
        assertDoesNotThrow(() -> eventValidator.validate(TestFixtures.event("events/event-success.json")));
    }

    @Test
    void missingContractIdThrowsWithFieldName() {
        InvalidEventException ex = assertThrows(InvalidEventException.class,
                () -> eventValidator.validate(TestFixtures.event("events/event-malformed.json")));
        assertTrue(ex.getMessage().contains("contractId"), ex.getMessage());
    }
}
