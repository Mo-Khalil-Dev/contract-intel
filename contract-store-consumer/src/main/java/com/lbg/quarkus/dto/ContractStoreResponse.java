package com.lbg.quarkus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Lean model of the Contract Store API response.
 *
 * <p>The real payload is large and deeply nested (ODCS v3); we map only the subset we keep.
 * {@code @JsonIgnoreProperties(ignoreUnknown = true)} drops everything else so the big
 * payload maps cleanly and survives schema changes.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ContractStoreResponse(Meta meta, Response response) {

    public boolean ok() {
        return meta != null && !meta.hasError() && meta.status() == 200;
    }

    public Data data() {
        return response != null ? response.data() : null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Meta(int status, boolean hasError, String correlationId, Long responseEpochMs) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(Data data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(
            String id,
            String version,                 // the contract's version, e.g. "0.0.8"
            String apiVersion,
            String kind,
            String dataProduct,
            String domain,
            String status,
            Description description,
            List<SchemaObject> schema,
            List<CustomProperty> customProperties,
            String contractCreatedTs,
            String signature
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Description(String purpose, String usage, String limitations) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SchemaObject(String name, String physicalName, String physicalType,
                               List<Column> properties) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Column(String name, String logicalType, String physicalType, Boolean required) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CustomProperty(String property, Object value) {
    }
}
