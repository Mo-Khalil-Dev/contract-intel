package com.lbg.quarkus.validation;

/** Shared validation regex patterns. */
public final class ValidationPatterns {

    public static final String UUID_REGEX =
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    private ValidationPatterns() {
    }
}
