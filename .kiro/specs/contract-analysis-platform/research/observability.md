# Observability

## Overview

| Concern                                  | Tool                     | Layer          |
| ---------------------------------------- | ------------------------ | -------------- |
| Backend APM & tracing                    | Dynatrace (OneAgent)     | NestJS         |
| DB & external API monitoring             | Dynatrace                | NestJS         |
| Frontend error tracking & session replay | LogRocket                | React          |
| Product analytics & feature flags        | PostHog                  | React + NestJS |
| Structured logs                          | pino → GCP Cloud Logging | NestJS         |
| Request correlation                      | `requestId` header       | Both           |

---

## Dynatrace (Backend APM)

Automatic instrumentation via OneAgent — no code changes required.

**Monitors:**

- Every HTTP request — latency, throughput, error rate
- Prisma DB queries — slow queries, connection pool health
- External API calls — Claude, Auth0, GCS, Google Document AI
- Background job processing — queue depth, job duration, failure rate
- Container metrics — CPU, memory, restart count on Cloud Run

**Dockerfile injection:**

```dockerfile
ENV DT_TENANT=${DT_TENANT}
ENV DT_TENANTTOKEN=${DT_TENANTTOKEN}
ENV DT_CONNECTION_POINT=${DT_CONNECTION_POINT}
```

**Key metrics:**

- `response_time_p99` per endpoint
- `error_rate` (% 5xx)
- `claude_api_latency`
- `db_query_time` (alert threshold: > 100ms)
- `queue_depth`

**Distributed tracing decision:** Phase 1 uses Dynatrace only (Option A). The `requestId` manually bridges HTTP traces to background job logs. Future upgrade: OpenTelemetry SDK exporting to Dynatrace via OTLP (Option B).

---

## LogRocket (Frontend APM & Session Replay)

```typescript
// src/main.tsx
LogRocket.init(import.meta.env.VITE_LOGROCKET_APP_ID, {
  dom: { privateAttributeBlocklist: ['data-sensitive'] },
  network: {
    requestSanitizer: (req) => {
      delete req.headers['Authorization'];
      return req;
    },
    responseSanitizer: (res) => {
      if (res.url.includes('/documents/')) res.body = '[redacted]';
      return res;
    },
  },
});

// After login
LogRocket.identify(user.id, { name: user.name, email: user.email, role: user.role });

// Link session to backend requestId
LogRocket.getSessionURL((sessionURL) => {
  apiClient.defaults.headers['X-LogRocket-Session'] = sessionURL;
});
```

**Captures:** session replay, JS errors, network requests, console logs, React state at error time.

---

## PostHog (Product Analytics & Feature Flags)

**Frontend setup:**

```typescript
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  capture_pageview: true,
  session_recording: { maskAllInputs: true },
});
posthog.identify(user.id, { email: user.email, role: user.role });
```

**Key events:**

```typescript
posthog.capture('document_uploaded', { fileType, fileSizeMb, engagementId });
posthog.capture('document_analysis_completed', { clauseCount, riskLevel, durationMs });
posthog.capture('clause_reviewed', { clauseType, reviewStatus, riskLevel });
posthog.capture('engagement_completed', { documentCount, totalClauses, durationDays });
posthog.capture('report_exported', { format, clauseCount });
```

**Feature flags:**

| Flag                      | Purpose                            | Evaluated                 | Default   |
| ------------------------- | ---------------------------------- | ------------------------- | --------- |
| `claude-analysis-enabled` | Kill switch for Claude API         | **Backend** (Node.js SDK) | `true`    |
| `document-ai-ocr-enabled` | Kill switch for Google Document AI | **Backend** (Node.js SDK) | `true`    |
| `export-docx-enabled`     | Enable DOCX export                 | Frontend                  | `false`   |
| `clause-comparison-v2`    | New comparison UI                  | Frontend                  | `false`   |
| `risk-score-display`      | A/B test score visualisation       | Frontend                  | `control` |

Backend flags use the PostHog Node.js SDK — the server decides before processing starts.

---

## Structured Logging

See `research/structured-logging.md` for full pino configuration, log fields, and GCP Cloud Logging setup.
