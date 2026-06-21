import { RiskAnalysisHandler } from './risk-analysis.handler';
import { ContextBuilder } from '../context/context-builder';
import { PortfolioContext } from '../context/portfolio-context';
import {
  AnswerResult,
  IClaudeAnswerService,
} from '../ports/claude-answer.service';
import { RankedListData } from './answer-format';

function context(n: number): PortfolioContext {
  return {
    queryType: 'risk-analysis',
    question: 'q',
    summary: {
      totalContracts: n,
      analysed: n,
      avgRisk: 6,
      criticalFlags: 0,
      unlimitedLiability: 0,
    },
    items: Array.from({ length: n }, (_, i) => ({
      ref: `doc:${i + 1}`,
      documentId: `${i + 1}`,
      title: `Contract ${i + 1}`,
      type: 'msa',
      counterparty: 'X',
      riskScore: 9 - i,
      riskBand: 'high' as const,
      flagsRed: 1,
      flagsOrange: 0,
      flagsBlue: 0,
      hasUnlimitedLiability: false,
      terminationDate: null,
    })),
  };
}

function buildHandler(answerText: string): RiskAnalysisHandler {
  const contextBuilder = {
    build: async () => context(4),
  } as unknown as ContextBuilder;
  const answer: IClaudeAnswerService = {
    answer: async (): Promise<AnswerResult> => ({ text: answerText }),
  };
  return new RiskAnalysisHandler(contextBuilder, answer);
}

describe('RiskAnalysisHandler', () => {
  it('scopes the table to the cited contracts', async () => {
    const handler = buildHandler('Two are above 8 [1][3].');
    const result = await handler.handle('org', 'risk above 8');
    const rows = (result.structuredData as RankedListData).rows;
    expect(rows.map((r) => r.documentId)).toEqual(['1', '3']);
  });

  it('falls back to the full ranked context when nothing is cited', async () => {
    const handler = buildHandler('Here is an overview with no citations.');
    const result = await handler.handle('org', 'overview');
    const rows = (result.structuredData as RankedListData).rows;
    expect(rows).toHaveLength(4);
  });
});
