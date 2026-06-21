import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_LIST_ITEM_REPOSITORY,
  IDocumentListItemRepository,
} from '../../../documents/application/projections/document-list-item/document-list-item.repository';
import { DocumentListItem } from '../../../documents/application/projections/document-list-item/document-list-item.read-model';
import { QueryType } from '../../domain/query-type';
import {
  PortfolioContext,
  PortfolioContextItem,
} from './portfolio-context';
import { parseRequestedCount } from './parse-requested-count';

/** How many contract rows to feed the model for a portfolio-wide question. */
const MAX_CONTEXT_ITEMS = 25;

/**
 * Builds a grounded {@link PortfolioContext} from the read-side portfolio
 * projection (Phase 10), scoped to the requesting user (v1: orgId ==
 * userId). It NEVER re-runs extraction — it reads what's already there.
 *
 * The MVP slice implements `risk-analysis`: the most-risky contracts plus
 * the portfolio KPI summary. Every other type currently reuses the same
 * risk-ordered read; Task 12.9 specialises each (e.g. timeline orders by
 * termination date, financial pulls payment metadata).
 */
@Injectable()
export class ContextBuilder {
  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY)
    private readonly portfolio: IDocumentListItemRepository,
  ) {}

  async build(
    orgId: string,
    queryType: QueryType,
    question: string,
  ): Promise<PortfolioContext> {
    // Honour an explicit count in the question ("top 2", "5 riskiest") so
    // the prose answer and the structured table operate on the same N.
    // Falls back to the full cap when no count is asked for.
    const requested = parseRequestedCount(question);
    const limit = requested ?? MAX_CONTEXT_ITEMS;

    const [page, summary] = await Promise.all([
      this.portfolio.findAll(orgId, {}, 'risk', 1, limit),
      this.portfolio.summary(orgId),
    ]);

    const items = page.items.map((row) => this.toItem(row));

    return {
      queryType,
      question,
      summary: {
        totalContracts: summary.totalContracts,
        analysed: summary.analysed,
        avgRisk: summary.avgRisk,
        criticalFlags: summary.criticalFlags,
        unlimitedLiability: summary.unlimitedLiability,
      },
      items,
    };
  }

  private toItem(row: DocumentListItem): PortfolioContextItem {
    return {
      ref: `doc:${row.id}`,
      documentId: row.id,
      title: row.name,
      type: row.type,
      counterparty: row.counterparty,
      riskScore: row.riskScore,
      riskBand: this.band(row.riskScore),
      flagsRed: row.flagsRed,
      flagsOrange: row.flagsOrange,
      flagsBlue: row.flagsBlue,
      hasUnlimitedLiability: row.hasUnlimitedLiability,
      terminationDate: row.terminationDate
        ? row.terminationDate.toISOString()
        : null,
    };
  }

  /** Risk band from a 0–10 score. Mirrors the portfolio KPI thresholds. */
  private band(score: number | null): PortfolioContextItem['riskBand'] {
    if (score === null) return 'unknown';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
}
