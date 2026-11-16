package com.lbg.quarkus.exception;

/**
 * The Contract Store responded but did not return the contract (empty/null data, or 404).
 *
 * <p>This can be a consistency race (the event arrived before the contract was committed),
 * so it is treated as retryable (short retry) and then dead-lettered. DECIDE with the team:
 * retry-then-DLQ vs treat-as-delete.
 */
public class ContractNotFoundException extends RuntimeException {
    public ContractNotFoundException(String message) {
        super(message);
    }
}
