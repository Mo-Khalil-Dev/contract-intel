import { MockClauseExtractor } from './mock-clause-extractor';

const SAMPLE_TEXT =
  'Indemnification. Vendor shall defend and indemnify Customer for IP claims. ' +
  'Limitation of Liability. Liability is capped at fees paid in the prior 12 months. ' +
  'Termination. Either party may terminate for material breach with 30 days notice. ' +
  'Payment shall be due net-30 from invoice date.';

describe('MockClauseExtractor', () => {
  it('emits 5 clauses including one nested under Termination', async () => {
    const extractor = new MockClauseExtractor();
    const out = await extractor.extract({
      documentId: 'doc-1',
      text: SAMPLE_TEXT,
      pages: [{ pageNumber: 1, startOffset: 0, endOffset: SAMPLE_TEXT.length }],
      language: 'en',
    });

    expect(out).toHaveLength(5);
    const child = out.find((c) => c.parentClientRef === 'c3');
    expect(child).toBeDefined();
    expect(child!.type).toBe('termination');
  });

  it('emits verbatim text findable via indexOf', async () => {
    const extractor = new MockClauseExtractor();
    const out = await extractor.extract({
      documentId: 'doc-1',
      text: SAMPLE_TEXT,
      pages: [{ pageNumber: 1, startOffset: 0, endOffset: SAMPLE_TEXT.length }],
      language: 'en',
    });
    for (const c of out) {
      expect(SAMPLE_TEXT.indexOf(c.text)).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic — same input yields same output', async () => {
    const extractor = new MockClauseExtractor();
    const a = await extractor.extract({
      documentId: 'doc-1',
      text: SAMPLE_TEXT,
      pages: [],
      language: 'en',
    });
    const b = await extractor.extract({
      documentId: 'doc-1',
      text: SAMPLE_TEXT,
      pages: [],
      language: 'en',
    });
    expect(a).toEqual(b);
  });

  it('emits zero clauses when no rule matches', async () => {
    const extractor = new MockClauseExtractor();
    const out = await extractor.extract({
      documentId: 'doc-1',
      text: 'Lorem ipsum dolor sit amet.',
      pages: [],
      language: 'en',
    });
    expect(out).toEqual([]);
  });

  it('reports a stable model version', () => {
    expect(new MockClauseExtractor().getModelVersion()).toBe(
      'mock/mock-clause-extractor@v1',
    );
  });
});
