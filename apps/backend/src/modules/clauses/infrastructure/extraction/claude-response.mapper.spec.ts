import type Anthropic from '@anthropic-ai/sdk';
import { mapClaudeResponseToClauses } from './claude-response.mapper';
import { ExtractionPermanentError } from '../../application/errors/clause-extraction-errors';

function toolUseBlock(input: unknown): Anthropic.Messages.ContentBlock {
  return {
    type: 'tool_use',
    id: 'tool_1',
    name: 'extract_clauses',
    input,
  } as Anthropic.Messages.ContentBlock;
}

function textBlock(text: string): Anthropic.Messages.ContentBlock {
  return { type: 'text', text, citations: null } as Anthropic.Messages.ContentBlock;
}

function validClause(overrides: Record<string, unknown> = {}) {
  return {
    clientRef: 'c1',
    parentClientRef: null,
    type: 'indemnification',
    confidence: 0.9,
    text: 'Indemnification text.',
    riskScore: 50,
    riskLevel: 'medium',
    riskFlags: [],
    riskExplanation: 'standard',
    ...overrides,
  };
}

describe('mapClaudeResponseToClauses', () => {
  it('returns clauses from a happy-path tool_use block', () => {
    const out = mapClaudeResponseToClauses([
      textBlock('preamble'),
      toolUseBlock({ clauses: [validClause()] }),
    ]);
    expect(out.clauses).toHaveLength(1);
    expect(out.clauses[0]).toMatchObject({
      clientRef: 'c1',
      type: 'indemnification',
      confidence: 0.9,
      riskLevel: 'medium',
    });
  });

  it('extracts metadata from the tool_use input', () => {
    const out = mapClaudeResponseToClauses([
      toolUseBlock({
        clauses: [validClause()],
        metadata: {
          contractType: 'Vendor',
          parties: [
            { role: 'Provider', name: 'Acme Corporation' },
            { role: 'Client', name: 'Our Company Ltd' },
          ],
          effectiveDate: '2024-01-15',
          terminationDate: '2025-01-14',
          noticePeriod: '60 days',
          autoRenewal: 'Yes, 1-year terms',
          paymentAmount: '£50,000',
          currency: 'GBP',
          paymentSchedule: 'Quarterly',
          priceEscalation: '2% annual',
          paymentTerms: 'Net 30 days',
        },
      }),
    ]);
    expect(out.metadata.contractType).toBe('Vendor');
    expect(out.metadata.parties).toHaveLength(2);
    expect(out.metadata.paymentAmount).toBe('£50,000');
  });

  it('returns empty metadata when omitted', () => {
    const out = mapClaudeResponseToClauses([
      toolUseBlock({ clauses: [validClause()] }),
    ]);
    expect(out.metadata.contractType).toBeNull();
    expect(out.metadata.parties).toEqual([]);
  });

  it('rejects malformed metadata.parties', () => {
    expect(() =>
      mapClaudeResponseToClauses([
        toolUseBlock({
          clauses: [validClause()],
          metadata: { parties: 'oops' },
        }),
      ]),
    ).toThrow();
  });

  it('throws corrupt_response when no tool_use is present', () => {
    expect(() =>
      mapClaudeResponseToClauses([textBlock('only text')]),
    ).toThrow(ExtractionPermanentError);
  });

  it('throws corrupt_response when tool_use has no clauses array', () => {
    expect(() =>
      mapClaudeResponseToClauses([toolUseBlock({ other: 'thing' })]),
    ).toThrow(ExtractionPermanentError);
  });

  it('rejects clauses with invalid type enum', () => {
    expect(() =>
      mapClaudeResponseToClauses([
        toolUseBlock({ clauses: [validClause({ type: 'indemnity' })] }),
      ]),
    ).toThrow(ExtractionPermanentError);
  });

  it('rejects confidence out of [0, 1]', () => {
    expect(() =>
      mapClaudeResponseToClauses([
        toolUseBlock({ clauses: [validClause({ confidence: 1.5 })] }),
      ]),
    ).toThrow(ExtractionPermanentError);
  });

  it('rejects non-integer riskScore', () => {
    expect(() =>
      mapClaudeResponseToClauses([
        toolUseBlock({ clauses: [validClause({ riskScore: 49.5 })] }),
      ]),
    ).toThrow(ExtractionPermanentError);
  });

  it('rejects riskFlags that is not a string[]', () => {
    expect(() =>
      mapClaudeResponseToClauses([
        toolUseBlock({ clauses: [validClause({ riskFlags: 'oops' })] }),
      ]),
    ).toThrow(ExtractionPermanentError);
  });

  it('accepts nested parent/child clauses', () => {
    const out = mapClaudeResponseToClauses([
      toolUseBlock({
        clauses: [
          validClause({ clientRef: 'p' }),
          validClause({ clientRef: 'c', parentClientRef: 'p' }),
        ],
      }),
    ]);
    expect(out.clauses).toHaveLength(2);
    expect(out.clauses[1].parentClientRef).toBe('p');
  });

  it('normalises undefined parentClientRef to null', () => {
    const clause = validClause();
    delete (clause as Record<string, unknown>).parentClientRef;
    const out = mapClaudeResponseToClauses([toolUseBlock({ clauses: [clause] })]);
    expect(out.clauses[0].parentClientRef).toBeNull();
  });
});
