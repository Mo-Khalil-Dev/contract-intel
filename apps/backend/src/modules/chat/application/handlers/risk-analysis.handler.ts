import { Injectable } from '@nestjs/common';
import { QueryHandler } from './query-handler';
import { QueryType } from '../../domain/query-type';
import { AnswerFormat, RankedListData } from './answer-format';
import { PortfolioContext } from '../context/portfolio-context';

/**
 * Risk-analysis handler (Phase 12 MVP, Task 12.4). Emits a `ranked-list`:
 * the in-scope contracts ordered by risk (the ContextBuilder already
 * sorts by risk), so the UI can render the risk result table directly.
 */
@Injectable()
export class RiskAnalysisHandler extends QueryHandler {
  readonly type: QueryType = 'risk-analysis';
  readonly format: AnswerFormat = 'ranked-list';

  protected formatResponse(context: PortfolioContext): RankedListData {
    return {
      rows: context.items.map((item) => ({
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
