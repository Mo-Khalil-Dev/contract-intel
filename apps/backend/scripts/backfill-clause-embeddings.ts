/**
 * Backfill script — Clause embeddings (Phase 11 pre-flight)
 *
 * Walks every Clause row with `embedding IS NULL` and computes embeddings
 * via the same Voyage driver used by Phase 8's extraction handler. Writes
 * the resulting 1024-dim vector + the driver's `embeddingModelVersion`
 * back into the row using a raw SQL UPDATE (Prisma cannot bind
 * `vector(1024)` directly).
 *
 * When this is needed:
 *   - Clauses were extracted while embeddings were disabled / mocked.
 *   - Voyage was rate-limited or unavailable during a prior ingest, so
 *     the extraction handler persisted clauses with `embedding=null`
 *     (deliberate isolation — see embedding-service.port.ts comment).
 *   - A schema change requires re-embedding (NOT this case — dim is
 *     still 1024 and the model is unchanged).
 *
 * Behaviour:
 *   - Idempotent: only touches rows where `embedding IS NULL`. Safe to
 *     re-run after partial failure.
 *   - Batches at 128 (Voyage server-side cap; the driver enforces the
 *     same).
 *   - Skips rows whose `text` is empty / whitespace — these were never
 *     embeddable. Reports them at the end so they can be inspected.
 *   - On a transient error, logs the failing batch and continues with
 *     the next batch rather than aborting the whole run. Permanent
 *     errors (auth, invalid request) abort with a non-zero exit code so
 *     the operator notices.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json \
 *     scripts/backfill-clause-embeddings.ts [--dry-run] [--limit=N]
 *
 *   --dry-run         Report what would be embedded; make no Voyage
 *                     calls and no DB writes.
 *   --limit=N         Cap the number of clauses processed in this run.
 *                     Useful for verifying the pipeline on a small
 *                     subset first.
 *   --re-embed-mock   Also re-embed clauses whose embeddingModelVersion
 *                     starts with 'mock/' — typically used the first
 *                     time real Voyage is enabled after running the
 *                     deterministic mock during development. Without
 *                     this flag, mock-embedded clauses are treated as
 *                     already-embedded and skipped.
 *
 * Environment:
 *   DATABASE_URL  required
 *   VOYAGE_API_KEY required (unless --dry-run)
 *   VOYAGE_MODEL  optional, defaults to 'voyage-law-2'
 */

// Match apps/backend/src/config/app-config.module.ts precedence:
// first match wins; .env.local overrides .env. dotenv.config() does not
// overwrite already-set variables by default, so loading .env.local first
// gives it precedence — same semantics as the NestJS ConfigModule.
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { VoyageAIClient } from 'voyageai';
import { VoyageEmbeddingService } from '../src/modules/clauses/infrastructure/embeddings/voyage-embedding-service';
import {
  EmbeddingPermanentError,
  EmbeddingTransientError,
} from '../src/modules/clauses/application/errors/clause-extraction-errors';

const BATCH_SIZE = 128;

interface ClauseRow {
  id: string;
  text: string;
}

interface Args {
  dryRun: boolean;
  limit: number | null;
  reEmbedMock: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, limit: null, reEmbedMock: false };
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--re-embed-mock') args.reEmbedMock = true;
    else if (a.startsWith('--limit=')) {
      const n = Number(a.split('=')[1]);
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`--limit must be a positive integer (got '${a}')`);
      }
      args.limit = n;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function loadPendingClauses(
  prisma: PrismaClient,
  limit: number | null,
  reEmbedMock: boolean,
): Promise<ClauseRow[]> {
  // Prisma's typed `where` doesn't expose `Unsupported("vector(1024)")`
  // columns — we have to filter via raw SQL. We only select `id` and
  // `text` (never the vector itself), so the cost is just the predicate.
  //
  // With --re-embed-mock, also include rows whose embedding was
  // produced by a `mock/*` driver — used when flipping from the dev
  // mock to real Voyage for the first time.
  const mockPredicate = reEmbedMock
    ? `OR "embeddingModelVersion" LIKE 'mock/%'`
    : '';
  const limitClause = limit != null ? `LIMIT ${limit}` : '';
  // String interpolation here is safe: `mockPredicate` and `limitClause`
  // are constants drawn from validated args, never from user input.
  return prisma.$queryRawUnsafe<ClauseRow[]>(
    `SELECT "id", "text"
     FROM "Clause"
     WHERE ("embedding" IS NULL ${mockPredicate})
     ORDER BY "createdAt" ASC
     ${limitClause}`,
  );
}

function buildVoyageService(): VoyageEmbeddingService {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is required (or pass --dry-run)');
  }
  const model = process.env.VOYAGE_MODEL ?? 'voyage-law-2';
  const client = new VoyageAIClient({ apiKey });
  return new VoyageEmbeddingService(client, model);
}

/**
 * Writes one embedding row. Uses raw SQL because Prisma cannot bind
 * `vector(1024)`. The vector is serialised as a pgvector literal:
 * `'[0.1,0.2,...]'`.
 */
async function writeEmbedding(
  prisma: PrismaClient,
  clauseId: string,
  vector: number[],
  modelVersion: string,
): Promise<void> {
  const literal = `[${vector.join(',')}]`;
  await prisma.$executeRaw`
    UPDATE "Clause"
    SET "embedding" = ${literal}::vector,
        "embeddingModelVersion" = ${modelVersion}
    WHERE "id" = ${clauseId}
  `;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const prisma = new PrismaClient();

  try {
    const pending = await loadPendingClauses(
      prisma,
      args.limit,
      args.reEmbedMock,
    );
    const embeddable = pending.filter((c) => c.text.trim().length > 0);
    const skippedEmpty = pending.length - embeddable.length;

    const scope = args.reEmbedMock
      ? 'without (Voyage) embeddings — includes mock-embedded rows'
      : 'without embeddings';
    console.log(
      `Found ${pending.length} clauses ${scope} ` +
        `(${embeddable.length} embeddable, ${skippedEmpty} skipped: empty text).`,
    );

    if (embeddable.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (args.dryRun) {
      console.log('--dry-run: no Voyage calls, no DB writes.');
      const byBatch = chunk(embeddable, BATCH_SIZE);
      console.log(
        `Would issue ${byBatch.length} batch(es) of up to ${BATCH_SIZE}.`,
      );
      return;
    }

    const voyage = buildVoyageService();
    const modelVersion = voyage.getModelVersion();
    console.log(`Using model: ${modelVersion}`);

    const batches = chunk(embeddable, BATCH_SIZE);
    let succeeded = 0;
    const failedBatches: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const results = await voyage.embedBatch(batch.map((c) => c.text));
        // Persist sequentially: pgvector writes are cheap, and a sequential
        // loop keeps Postgres connection pressure predictable.
        for (let j = 0; j < batch.length; j++) {
          await writeEmbedding(
            prisma,
            batch[j].id,
            results[j].vector,
            modelVersion,
          );
        }
        succeeded += batch.length;
        console.log(
          `  batch ${i + 1}/${batches.length}: ${batch.length} embedded ` +
            `(${succeeded}/${embeddable.length} total)`,
        );
      } catch (err) {
        if (err instanceof EmbeddingPermanentError) {
          console.error(
            `Permanent error on batch ${i + 1}: ${err.message}. Aborting.`,
          );
          process.exitCode = 1;
          return;
        }
        if (err instanceof EmbeddingTransientError) {
          console.warn(
            `Transient error on batch ${i + 1}: ${err.message}. ` +
              `Skipping batch; re-run the script to retry.`,
          );
          failedBatches.push({ index: i + 1, error: err.message });
          continue;
        }
        throw err;
      }
    }

    console.log('---');
    console.log(`Done: ${succeeded}/${embeddable.length} clauses embedded.`);
    if (skippedEmpty > 0) {
      console.log(`Skipped ${skippedEmpty} clause(s) with empty text.`);
    }
    if (failedBatches.length > 0) {
      console.log(`Transient failures on ${failedBatches.length} batch(es):`);
      for (const f of failedBatches) {
        console.log(`  batch ${f.index}: ${f.error}`);
      }
      console.log('Re-run the script to retry these.');
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
