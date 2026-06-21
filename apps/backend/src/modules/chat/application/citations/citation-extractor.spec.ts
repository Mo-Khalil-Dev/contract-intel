import { extractCitations } from './citation-extractor';
import { PortfolioContext } from '../context/portfolio-context';

function contextWith(n: number): PortfolioContext {
  return {
    queryType: 'risk-analysis',
    question: 'q',
    summary: {
      totalContracts: n,
      analysed: n,
      avgRisk: 5,
      criticalFlags: 0,
      unlimitedLiability: 0,
    },
    items: Array.from({ length: n }, (_, i) => ({
      ref: `doc:${i + 1}`,
      documentId: `${i + 1}`,
      title: `Contract ${i + 1}`,
      type: 'msa',
      counterparty: 'X',
      riskScore: 5,
      riskBand: 'medium' as const,
      flagsRed: 0,
      flagsOrange: 0,
      flagsBlue: 0,
      hasUnlimitedLiability: false,
      terminationDate: null,
    })),
  };
}

describe('extractCitations', () => {
  it('maps valid markers to context items', () => {
    const result = extractCitations('Found [1] and [3].', contextWith(3));
    expect(result).toEqual([
      { index: 1, ref: 'doc:1', documentId: '1', title: 'Contract 1' },
      { index: 3, ref: 'doc:3', documentId: '3', title: 'Contract 3' },
    ]);
  });

  it('drops unbacked references outside the context range', () => {
    const result = extractCitations('See [1] and [9].', contextWith(2));
    expect(result.map((c) => c.index)).toEqual([1]);
  });

  it('collapses duplicate markers', () => {
    const result = extractCitations('[2] then again [2].', contextWith(2));
    expect(result).toHaveLength(1);
    expect(result[0].index).toBe(2);
  });

  it('returns empty when there are no markers', () => {
    expect(extractCitations('No citations here.', contextWith(2))).toEqual([]);
  });

  it('sorts citations by index', () => {
    const result = extractCitations('[3] [1] [2]', contextWith(3));
    expect(result.map((c) => c.index)).toEqual([1, 2, 3]);
  });
});
