# Contract Intel — Backend

NestJS backend for the Contract Analysis Platform.

## Development

```bash
npm run dev          # start with hot-reload
npm run build        # compile to dist/
npm run test         # unit tests
npm run test:e2e     # end-to-end tests
```

## Database

```bash
npm run db:migrate   # apply pending migrations (dev)
npm run db:generate  # regenerate Prisma client after schema changes
npm run db:studio    # open Prisma Studio
npm run db:reset     # wipe + re-migrate (dev only)
```

## One-off scripts

### `backfill:list-items` — Populate the Contracts View read model

Introduced in **Phase 10**. The `document_list_items` table is a CQRS
read-model that is kept fresh by domain event handlers going forward, but
documents that existed before the Phase 10 deploy have no row. This script
backfills them.

```bash
# from apps/backend/
npm run backfill:list-items
```

**What it does**

For every `Document` row the script:

1. Computes `status` from `extractionStatus`:
   - `extraction_complete` → `complete`
   - `extraction_failed` → `failed`
   - anything else → `processing`
2. For `complete` documents, fetches the current `ExtractionRun`'s clauses
   and metadata to compute `riskScore` (max clause score ÷ 10), flag
   counts (`flagsRed/Orange/Blue`), `hasUnlimitedLiability`, `counterparty`,
   and `terminationDate`.
3. Upserts the row into `document_list_items`.

**Idempotent** — safe to re-run at any time. Each upsert overwrites the
projection with freshly computed values, so partial runs leave no
inconsistency. The script exits with code 1 if any individual document
fails, so CI/CD pipelines can detect errors.

**Environment** — reads `DATABASE_URL` from `.env` (same file used by the
NestJS server). Run against a production database by setting `DATABASE_URL`
in the shell before running the command.

```bash
DATABASE_URL=postgres://... npm run backfill:list-items
```

**Output example**

```
Starting DocumentListItem backfill…

  batch done — processed: 100, upserted: 100, failed: 0
  batch done — processed: 200, upserted: 198, failed: 2
  ✗ <id> (contract.pdf): ...

✅ Backfill complete
   Total processed : 200
   Upserted        : 198
   Failed          : 2
```
