/**
 * Integration tests for PgvectorClauseSimilarityRepository.
 *
 * Uses the real PostgreSQL test database (DATABASE_URL from .env.test or
 * the dev DB). Runs only when the gating env var is set, to keep `npm
 * test` fast for the default loop:
 *
 *   CLAUSE_SIMILARITY_INTEGRATION_TEST=1 npm test --workspace=apps/backend
 *
 * Each suite seeds and tears down its own data — the helpers below use
 * a per-suite test prefix so cleanup is precise even if a prior run
 * crashed mid-test.
 *
 * **Validates: Requirement 14 (US-CI-1 AC1, AC2, AC3, AC5).**
 */
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { PgvectorClauseSimilarityRepository } from '../pgvector-clause-similarity.repository';

const RUN_INTEGRATION =
  process.env.CLAUSE_SIMILARITY_INTEGRATION_TEST === '1';
const describeOrSkip = RUN_INTEGRATION ? describe : describe.skip;

const TEST_PREFIX = `phase11-test-${Date.now()}-`;

interface SeedDocSpec {
  id: string;
  name: string;
}
interface SeedClauseSpec {
  id: string;
  documentId: string;
  type: string;
  text: string;
  embedding: number[]; // exactly 1024 dims
  pageNumber?: number;
}

function id(suffix: string): string {
  // The schema stores ids as TEXT (UUID-shaped from the application VOs),
  // but the columns are TEXT not UUID — any unique string works.
  return `${TEST_PREFIX}${suffix}`;
}

/** Build a 1024-dim vector dominated by the given small "fingerprint". */
function vec(fingerprint: number[]): number[] {
  const out = new Array(1024).fill(0);
  for (let i = 0; i < fingerprint.length && i < 1024; i++) {
    out[i] = fingerprint[i];
  }
  return out;
}

function buildPrismaService(): PrismaService {
  const client = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  (client as unknown as PrismaService).onModuleInit = async () => {
    await client.$connect();
  };
  (client as unknown as PrismaService).onModuleDestroy = async () => {
    await client.$disconnect();
  };
  return client as unknown as PrismaService;
}

describeOrSkip('PgvectorClauseSimilarityRepository (integration)', () => {
  let prisma: PrismaService;
  let raw: PrismaClient;
  let repository: PgvectorClauseSimilarityRepository;
  // Single shared extraction-run row is fine; clauses FK it.
  const runId = id('run');

  beforeAll(async () => {
    prisma = buildPrismaService();
    raw = prisma as unknown as PrismaClient;
    await raw.$connect();
    repository = new PgvectorClauseSimilarityRepository(prisma);
  });

  afterAll(async () => {
    // Cleanup order: Clause → ExtractionRun → Document (FKs).
    await raw.$executeRawUnsafe(
      `DELETE FROM "Clause" WHERE "id" LIKE $1`,
      `${TEST_PREFIX}%`,
    );
    await raw.$executeRawUnsafe(
      `DELETE FROM "ExtractionRun" WHERE "id" LIKE $1`,
      `${TEST_PREFIX}%`,
    );
    await raw.$executeRawUnsafe(
      `DELETE FROM "Document" WHERE "id" LIKE $1`,
      `${TEST_PREFIX}%`,
    );
    await raw.$disconnect();
  });

  // ── Helpers (use raw SQL — Prisma can't bind vector(1024)) ────────────

  async function seedDocument(doc: SeedDocSpec): Promise<void> {
    await raw.$executeRawUnsafe(
      `INSERT INTO "Document"
        ("id","name","type","sizeBytes","status","storageKey","uploadedBy","orgId","processingStatus","extractionStatus","createdAt","updatedAt")
       VALUES ($1,$2,'PDF',1024,'complete',$3,$4,$4,'ocr_complete','extraction_complete',NOW(),NOW())`,
      doc.id,
      doc.name,
      `${doc.id}.pdf`,
      id('user'),
    );
  }

  async function ensureRun(): Promise<void> {
    await raw.$executeRawUnsafe(
      `INSERT INTO "ExtractionRun"
        ("id","documentId","classifierModelVersion","embeddingModelVersion","status","startedAt","createdAt")
       VALUES ($1, $2, 'test-clf@2026', 'test-emb@2026', 'extraction_complete', NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      runId,
      id('doc-A'), // any FK target; the run row is shared
    );
  }

  async function seedClause(c: SeedClauseSpec): Promise<void> {
    const literal = `[${c.embedding.join(',')}]`;
    await raw.$executeRawUnsafe(
      `INSERT INTO "Clause"
        ("id","extractionRunId","documentId","type","confidence","pageNumber","startOffset","endOffset","text","embedding","embeddingModelVersion","createdAt")
       VALUES ($1,$2,$3,$4,0.9,$5,0,${c.text.length},$6,$7::vector,'test-emb@2026',NOW())`,
      c.id,
      runId,
      c.documentId,
      c.type,
      c.pageNumber ?? 1,
      c.text,
      literal,
    );
  }

  // ── findSimilar — happy path ──────────────────────────────────────────

  describe('findSimilar', () => {
    beforeAll(async () => {
      await seedDocument({ id: id('doc-A'), name: 'Acme MSA' });
      await seedDocument({ id: id('doc-B'), name: 'Globex MSA' });
      await seedDocument({ id: id('doc-C'), name: 'Initech Order' });
      await ensureRun();

      await seedClause({
        id: id('src'),
        documentId: id('doc-A'),
        type: 'limitation_of_liability',
        text: 'Liability shall not exceed twelve months fees.',
        embedding: vec([1, 0, 0, 0]),
      });
      await seedClause({
        id: id('near'),
        documentId: id('doc-B'),
        type: 'limitation_of_liability',
        text: 'Aggregate liability capped at amounts paid in prior 12 months.',
        embedding: vec([0.95, 0.05, 0, 0]),
      });
      await seedClause({
        id: id('mid'),
        documentId: id('doc-C'),
        type: 'limitation_of_liability',
        text: 'Liability cap equals greater of fees paid or one million.',
        embedding: vec([0.7, 0.3, 0, 0]),
      });
      await seedClause({
        id: id('sibling-same-doc'),
        documentId: id('doc-A'),
        type: 'limitation_of_liability',
        text: 'Should not appear: same document.',
        embedding: vec([0.99, 0.01, 0, 0]),
      });
      await seedClause({
        id: id('wrong-type'),
        documentId: id('doc-B'),
        type: 'indemnification',
        text: 'Should not appear: wrong type.',
        embedding: vec([1, 0, 0, 0]),
      });
      await seedClause({
        id: id('weak'),
        documentId: id('doc-C'),
        type: 'limitation_of_liability',
        text: 'Should not appear: below minSimilarity.',
        embedding: vec([0.2, 0.9, 0, 0]),
      });
    });

    it('returns same-type matches ordered by descending similarity', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('src'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 5,
      });

      const ids = results.map((r) => r.id);
      expect(ids).toContain(id('near'));
      expect(ids).toContain(id('mid'));

      // Ordering — near is more similar to src than mid is.
      const nearIdx = ids.indexOf(id('near'));
      const midIdx = ids.indexOf(id('mid'));
      expect(nearIdx).toBeLessThan(midIdx);
    });

    it('excludes the source clause itself', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('src'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 5,
      });
      expect(results.map((r) => r.id)).not.toContain(id('src'));
    });

    it('excludes clauses from the same document', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('src'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 5,
      });
      expect(results.map((r) => r.id)).not.toContain(id('sibling-same-doc'));
    });

    it('filters out other clause types', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('src'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 5,
      });
      expect(results.map((r) => r.id)).not.toContain(id('wrong-type'));
    });

    it('applies the default minSimilarity floor (0.5)', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('src'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 10,
      });
      expect(results.map((r) => r.id)).not.toContain(id('weak'));
    });

    it('returns the Document title and uploadedAt joined onto the row', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('src'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 5,
      });
      const near = results.find((r) => r.id === id('near'));
      expect(near).toBeDefined();
      expect(near!.document.title).toBe('Globex MSA');
      expect(near!.document.uploadedAt).toBeInstanceOf(Date);
    });

    it('returns [] when the source clause does not exist', async () => {
      const results = await repository.findSimilar({
        sourceClauseId: id('does-not-exist'),
        sourceDocumentId: id('doc-A'),
        clauseType: 'limitation_of_liability',
        limit: 5,
      });
      expect(results).toEqual([]);
    });
  });
});
