package com.lbg.quarkus;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.lbg.quarkus.dto.ContractStoreEventDto;
import com.lbg.quarkus.dto.ContractStoreResponse;
import com.lbg.quarkus.dto.GovernanceProduct;

/**
 * Shared test helpers: a Jackson mapper configured like the app (JSR-310 + case-insensitive
 * enums) and loaders for the JSON fixtures.
 */
public final class TestFixtures {

    public static final ObjectMapper MAPPER = JsonMapper.builder()
            .findAndAddModules()                                 // java.time (Instant)
            .enable(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS) // "Success" -> SUCCESS
            .build();

    private TestFixtures() {
    }

    public static <T> T load(String path, Class<T> type) {
        try (var in = cl().getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalArgumentException("fixture not found on classpath: " + path);
            }
            return MAPPER.readValue(in, type);
        } catch (Exception e) {
            throw new RuntimeException("failed to load fixture " + path, e);
        }
    }

    public static ContractStoreEventDto event(String path) {
        return load(path, ContractStoreEventDto.class);
    }

    public static ContractStoreResponse contractResponse(String path) {
        return load(path, ContractStoreResponse.class);
    }

    public static GovernanceProduct governance(String path) {
        return load(path, GovernanceProduct.class);
    }

    private static ClassLoader cl() {
        return Thread.currentThread().getContextClassLoader();
    }
}
