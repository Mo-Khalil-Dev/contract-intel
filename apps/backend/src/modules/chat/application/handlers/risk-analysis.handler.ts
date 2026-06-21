import { Injectable } from '@nestjs/common';
import { QueryHandler } from './query-handler';
import { QueryType } from '../../domain/query-type';
import { AnswerFormat, RankedListData } from './answer-format';
import { PortfolioContext } from '../context/portfolio-context';
import { Citation } from '../citations/citation-extractor';

/**
 * Risk-analysis handler (Phase 12 MVP, Task 12.4). Emits a `ranked-list`
 * of the contracts the answer actually references.
 *
 * The table is scoped to the **cited** contracts, not the whole context.
 * Whatever filter the question implies ("top 2", "risk above 8",
 * "unlimited liability") is resolved by the model when it decides which
 * contracts to cite — so the table mirrors the prose without the handler
 * re-parsing the question. Rows stay risk-ordered (the ContextBuilder
 * sorts the context by risk). When the answer cites nothing, we fall back
 * to the full ranked context.
 */
@Injectable()
export class RiskAnalysisHandler extends QueryHandler {
  readonly type: QueryType = 'risk-analysis';
  readonly format: AnswerFormat = 'ranked-list';

  protected formatResponse(
    context: PortfolioContext,
    citations: Citation[],
  ): RankedListData {
    const cited = new Set(citations.map((c) => c.documentId));
    const scoped =
      cited.size > 0
        ? context.items.filter((item) => cited.has(item.documentId))
        : context.items;

    return {
      rows: scoped.map((item) => ({
        documentId: item.documentId,
        title: item.title,
        type: item.type,
        counterparty: item.counterparty,
        riskScore: item.riskScore,
        riskBand: item.riskBand,
        flagsRed: item.flagsRed,
        hasUnlimitedLiability: item.hasUnlimitedLiability,
      })),
    };
  }
}
