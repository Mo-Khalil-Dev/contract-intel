# Anthropic Claude — Setup

Provisioning for the Phase 8 clause-extraction driver (`CLAUSE_EXTRACTOR=anthropic`).

## 1. Get an API key

1. Sign in at <https://console.anthropic.com>
2. **Settings → API Keys → Create Key**
3. Copy the key (you only see it once).

## 2. Set env vars

Add to `apps/backend/.env`:

```bash
CLAUSE_EXTRACTOR=anthropic
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-7   # default; cost-optimise with claude-sonnet-4-6
```

Restart the backend; the boot-time DI factory wires `CLAUSE_EXTRACTOR` to
`ClaudeClauseExtractor` instead of `MockClauseExtractor`.

## 3. Verify with the live integration test

```bash
cd apps/backend
CLAUSE_EXTRACTOR_LIVE_TEST=1 CLAUDE_API_KEY=sk-ant-... \
  npx jest claude-clause-extractor.live.spec.ts
```

Single 5-clause test contract. Cost ~$0.05–0.20 on Opus 4.7.

Default `npm run test` does NOT run this — the test self-skips when the
flag is unset, so CI never pays.

## 4. Cost expectations

| Item                                        | Approx (Opus 4.7) |
|---------------------------------------------|-------------------|
| 50-page contract, prompt-cache cold         | $0.20–0.30        |
| 50-page contract, prompt-cache warm         | $0.05–0.10        |
| Test fixture (5 short clauses)              | $0.05–0.20        |

Prompt caching is applied to the system prompt + tool schema with
`cache_control: ephemeral`. After the first call within ~5 minutes the
static prefix is read from cache (~75% discount on those tokens).

## 5. Model swap

To trade some quality for ~5× cost reduction:

```bash
CLAUDE_MODEL=claude-sonnet-4-6
```

No code change. Re-run the live test to compare extraction quality
before committing to the swap in prod.

## 6. Failure modes

The driver maps SDK errors per `application/errors/clause-extraction-errors.ts`:

| HTTP / SDK signal                              | Mapped to                                  | Handler behaviour     |
|------------------------------------------------|--------------------------------------------|-----------------------|
| 429, 503, 529, `overloaded_error`              | `ExtractionTransientError`                 | Retry 1s / 4s / 16s   |
| Connection / timeout                           | `ExtractionTransientError`                 | Retry                 |
| 400 with "context", "too long", "exceed"       | `ExtractionPermanentError('context_overflow')` | Fail extraction_run   |
| 401, 403                                       | `ExtractionPermanentError('unauthorized')` | Fail extraction_run   |
| Other 400                                      | `ExtractionPermanentError('invalid_request')`  | Fail extraction_run   |
| Unknown                                        | `ExtractionPermanentError('internal_error')`   | Fail extraction_run   |

`failureReason` surfaces on `ExtractionRun.failureReason`, the API, and
(eventually) the UI.

## 7. Chunking

Documents above 200k chars are split by page boundaries and run in
parallel. Per-chunk clientRefs are namespaced (`chunk0:c1`, `chunk1:c1`,
…) so the handler's parent-resolution pass doesn't collapse references
from different chunks.
