package com.lbg.quarkus;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.common.ConsoleNotifier;
import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;

import java.util.Map;

import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;

/**
 * Starts a WireMock server for the test run and points BOTH REST clients at it,
 * so the real reactive clients + serialization + resilience are exercised against
 * canned responses (no live APIs needed).
 *
 * <p>Requires a WireMock dependency in test scope, e.g.
 * {@code com.github.tomakehurst:wiremock-jre8} (or {@code quarkus-wiremock}).
 */
public class WireMockResource implements QuarkusTestResourceLifecycleManager {

    private WireMockServer server;

    @Override
    public Map<String, String> start() {
        // ConsoleNotifier(true) logs every request + whether it matched a stub (great for debugging)
        server = new WireMockServer(options().dynamicPort().notifier(new ConsoleNotifier(true)));
        server.start();
        String base = server.baseUrl();
        return Map.of(
                "quarkus.rest-client.\"contract-store\".url", base,
                "quarkus.rest-client.\"governance\".url", base
        );
    }

    @Override
    public void stop() {
        if (server != null) {
            server.stop();
        }
    }

    @Override
    public void inject(TestInjector testInjector) {
        testInjector.injectIntoFields(server,
                new TestInjector.AnnotatedAndMatchesType(InjectWireMock.class, WireMockServer.class));
    }
}
