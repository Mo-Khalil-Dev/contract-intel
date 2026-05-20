import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClauseExtractionCompletedEvent } from '../../../../../clauses/domain/events/clause.events';
import { PrismaService } from '../../../../../../shared/infrastructure/prisma/prisma.service';
import { DOCUMENT_LIST_ITEM_REPOSITORY } from '../document-list-item.repository';
import type { IDocumentListItemRepository, DocumentListItemPatch } from '../document-list-item.repository';

interface ClauseRiskRow {
  riskScore: number | null;
  riskLevel: string | null;
  riskFlags: string[];
}

interface MetadataJson {
  parties?: { role: string; name: string }[];
  terminationDate?: string | null;
  contractType?: string | null;
}

function tryParseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computePatch(clauses: ClauseRiskRow[], meta: MetadataJson | null): DocumentListItemPatch {
  const scored = clauses.filter((c) => c.riskScore !== null);
  const maxScore = scored.length > 0 ? Math.max(...scored.map((c) => c.riskScore!)) : null;

  return {
    status: 'complete',
    riskScore: maxScore !== null ? Math.round(maxScore) / 10 : null,
    flagsRed: clauses.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical').length,
    flagsOrange: clauses.filter((c) => c.riskLevel === 'medium').length,
    flagsBlue: clauses.filter((c) => c.riskLevel === 'low').length,
    hasUnlimitedLiability: clauses.some((c) => c.riskFlags.includes('unlimited_liability')),
    counterparty: meta?.parties?.[0]?.name ?? '',
    terminationDate: meta?.terminationDate ? tryParseDate(meta.terminationDate) : null,
  };
}

@EventsHandler(ClauseExtractionCompletedEvent)
export class OnClauseExtractionCompletedHandler
  implements IEventHandler<ClauseExtractionCompletedEvent>
{
  private readonly logger = new Logger(OnClauseExtractionCompletedHandler.name);

  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY)
    private readonly listRepo: IDocumentListItemRepository,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: ClauseExtractionCompletedEvent): Promise<void> {
    const { documentId } = event;
    try {
      const [clauses, run] = await Promise.all([
        this.prisma.clause.findMany({
          where: { documentId },
          select: { riskScore: true, riskLevel: true, riskFlags: true },
        }),
        this.prisma.extractionRun.findUnique({
          where: { id: event.getAggregateId() },
          select: { metadata: true },
        }),
      ]);

      const meta = run?.metadata as MetadataJson | null ?? null;
      const patch = computePatch(clauses as ClauseRiskRow[], meta);

      await this.listRepo.update(documentId, patch);
      this.logger.log(
        `DocumentListItem updated to 'complete' for document ${documentId} (riskScore=${patch.riskScore ?? 'null'})`,
      );
    } catch (err) {
      this.logger.error(
        `OnClauseExtractionCompletedHandler failed for ${documentId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
