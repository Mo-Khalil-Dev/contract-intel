# Voyage AI — Setup

Provisioning for the Phase 8 embedding driver (`EMBEDDING_DRIVER=voyage`).

## 1. Get an API key

1. Sign up at <https://www.voyageai.com>
2. Dashboard → API Keys → Create Key
3. Copy the key (`pa-...` format) — keep it in your terminal/`.env`, never paste it in chat or commit it.

**Free tier**: 50M tokens/month. Enough for all Phase 8 dev + heavy testing.

## 2. Set env vars

Add to `apps/backend/.env`:

```bash
EMBEDDING_DRIVER=voyage
VOYAGE_API_KEY=pa-...
VOYAGE_MODEL=voyage-law-2   # default; switching dim requires a migration
```

Restart the backend. The DI factory wires `EMBEDDING_DRIVER` to
`VoyageEmbeddingService` instead of `MockEmbeddingService`.

## 3. Verify with the live integration test

```bash
cd apps/backend
EMBEDDINGS_LIVE_TEST=1 VOYAGE_API_KEY=pa-... \
  npx jest voyage-embedding-service.live.spec.ts
```

3-input test, ~50 tokens each. Cost: **<$0.001** (or $0 inside free tier).
The test self-skips when env flags are unset, so default CI never pays.

## 4. Cost expectations

| Workload                                 | Tokens  | Cost (paid tier) |
|------------------------------------------|---------|------------------|
| Embed one 50-clause contract             | ~25K    | ~$0.003          |
| Embed 100 contracts                      | ~2.5M   | ~$0.30           |
| Embed 10,000 contracts                   | ~250M   | ~$30 (after free)|
| Phase 10 search query (single embed)     | ~50     | $0.000006        |

Free tier covers all dev + likely all small-team production usage.

## 5. The locked-dim trap

`Clause.embedding` is `vector(1024)` in the Prisma schema. Voyage models
output different dims:

| Model                 | Dim   | Works with our schema? |
|-----------------------|-------|------------------------|
| `voyage-law-2`        | 1024  | ✅ default              |
| `voyage-3`            | 1024  | ✅                      |
| `voyage-3-large`      | 1024  | ✅ (matryoshka default) |
| `voyage-finance-2`    | 1024  | ✅                      |
| `voyage-multilingual-2`| 1024 | ✅                      |
| `voyage-3-lite`       | 512   | ❌ migration required   |
| `voyage-code-3`       | 1024  | ✅                      |

The adapter throws `EmbeddingPermanentError('dimension_mismatch')` if a
returned vector isn't 1024 dims. Switching to a 512-dim model means a
Prisma migration to change the column + a backfill job to re-embed
every clause.

## 6. Failure modes

| Voyage signal                             | Mapped to                                   | Handler behaviour     |
|-------------------------------------------|---------------------------------------------|-----------------------|
| 429, 5xx                                  | `EmbeddingTransientError`                   | Retry 1s/4s/16s       |
| Timeout, ENOTFOUND, fetch failed          | `EmbeddingTransientError`                   | Retry                 |
| 401, 403                                  | `EmbeddingPermanentError('unauthorized')`   | Persist embedding=null|
| 400                                       | `EmbeddingPermanentError('invalid_request')`| Persist embedding=null|
| Dim mismatch / corrupt response           | `EmbeddingPermanentError(...)`              | Persist embedding=null|
| Unknown                                   | `EmbeddingPermanentError('internal_error')` | Persist embedding=null|

Note: per the handler design, embedding failures DON'T fail the whole
extraction run. Clauses still persist with `embedding=null`; a deferred
backfill job can re-embed them. This is the "embedding-failure
isolation" property locked in design.md §D10.

## 7. Batching

Voyage accepts up to **128 inputs per request**. The adapter splits
larger inputs locally and sends batches in parallel. Typical contracts
have <100 clauses → one round-trip.

## 8. `input_type` reminder

The adapter sends `inputType: 'document'` for clause indexing.
**Phase 10 semantic search** will call with `inputType: 'query'` for the
user's search-query embedding. Same model, slightly different output
distributions — mixing them costs ~5% retrieval precision.
