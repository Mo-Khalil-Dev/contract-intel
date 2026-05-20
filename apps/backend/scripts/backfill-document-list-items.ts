/**
 * Backfill script — document_list_items (Phase 10)
 *
 * Walks every existing Document row and upserts a DocumentListItem
 * projection so the Contracts View (Portfolio) screen has data for
 * documents that existed before the Phase 10 event handlers were deployed.
 *
 * Safe to re-run — every upsert overwrites the projection with freshly
 * computed values, so partial runs leave no inconsistency.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/backfill-document-list-items.ts
 *
 * Environment:
 *   DATABASE_URL must be set (reads from .env automatically).
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const BATCH_SIZE = 100;

type DocumentStatus = 'processing' | 'complete' | 'failed';

interface RunMetadata {
  parties?: Array<{ role: string; name: string }>;
  terminationDate?: string | null;
}

interface ClauseRiskRow {
  riskScore: number | null;
  riskLevel: string | null;
  riskFlags: string[];
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

function tryParseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeStatus(extractionStatus: string): DocumentStatus {
  if (extractionStatus === 'extraction_complete') return 'complete';
  if (extractionStatus === 'extraction_failed') return 'failed';
  return 'processing';
}

function computeRiskScore(clauses: ClauseRiskRow[]): number | null {
  const scored = clauses.filter((c) => c.riskScore !== null);
  if (scored.length === 0) return null;
  const max = Math.max(...scored.map((c) => c.riskScore as number));
  return Math.round(max) / 10;
}

async function processDocument(
  prisma: PrismaClient,
  doc: {
    id: string;
    name: string;
    type: string;
    orgId: string;
    extractionStatus: string;
    currentExtractionRunId: string | null;
    createdAt: Date;
  },
): Promise<void> {
  const status = computeStatus(doc.extractionStatus);

  let riskScore: number | null = null;
  let flagsRed = 0;
  let flagsOrange = 0;
  let flagsBlue = 0;
  let hasUnlimitedLiability = false;
  let counterparty = '';
  let terminationDate: Date | null = null;

  if (status === 'complete' && doc.currentExtractionRunId) {
    const [clauses, run] = await Promise.all([
      prisma.clause.findMany({
        where: { documentId: doc.id },
        select: { riskScore: true, riskLevel: true, riskFlags: true },
      }),
      prisma.extractionRun.findUnique({
        where: { id: doc.currentExtractionRunId },
        select: { metadata: true },
      }),
    ]);

    const clauseRows = clauses as ClauseRiskRow[];
    riskScore = computeRiskScore(clauseRows);
    flagsRed = clauseRows.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical').length;
    flagsOrange = clauseRows.filter((c) => c.riskLevel === 'medium').length;
    flagsBlue = clauseRows.filter((c) => c.riskLevel === 'low').length;
    hasUnlimitedLiability = clauseRows.some((c) => c.riskFlags.includes('unlimited_liability'));

    const meta = (run?.metadata ?? null) as RunMetadata | null;
    counterparty = meta?.parties?.[0]?.name ?? '';
    terminationDate = meta?.terminationDate ? tryParseDate(meta.terminationDate) : null;
  }

  const projection = {
    orgId: doc.orgId,
    name: stripExtension(doc.name),
    type: doc.type,
    status,
    uploadedAt: doc.createdAt,
    counterparty,
    riskScore,
    flagsRed,
    flagsOrange,
    flagsBlue,
    terminationDate,
    hasUnlimitedLiability,
  };

  await prisma.documentListItem.upsert({
    where: { id: doc.id },
    create: { id: doc.id, ...projection },
    update: projection,
  });
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  const counts = { processed: 0, upserted: 0, failed: 0 };

  console.log('Starting DocumentListItem backfill…\n');

  try {
    let cursor: string | undefined;

    for (;;) {
      const batch = await prisma.document.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          orgId: true,
          extractionStatus: true,
          currentExtractionRunId: true,
          createdAt: true,
        },
      });

      if (batch.length === 0) break;
      cursor = batch[batch.length - 1].id;

      for (const doc of batch) {
        counts.processed++;
        try {
          await processDocument(prisma, doc);
          counts.upserted++;
        } catch (err) {
          counts.failed++;
          console.error(`  ✗ ${doc.id} (${doc.name}): ${(err as Error).message}`);
        }
      }

      console.log(
        `  batch done — processed: ${counts.processed}, upserted: ${counts.upserted}, failed: ${counts.failed}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✅ Backfill complete');
  console.log(`   Total processed : ${counts.processed}`);
  console.log(`   Upserted        : ${counts.upserted}`);
  console.log(`   Failed          : ${counts.failed}`);

  if (counts.failed > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal:', err);
  process.exit(1);
});
