import {
  DocAiDocument,
  mapDocAiDocumentsToOcrOutput,
} from './document-ai-response.mapper';

function token(start: number, end: number, confidence: number) {
  return {
    layout: {
      textAnchor: { textSegments: [{ startIndex: String(start), endIndex: String(end) }] },
      confidence,
    },
  };
}

describe('mapDocAiDocumentsToOcrOutput', () => {
  it('maps a one-page Document AI response', () => {
    const doc: DocAiDocument = {
      text: 'Section 1. Indemnification.',
      pages: [
        {
          pageNumber: 1,
          layout: {
            textAnchor: { textSegments: [{ startIndex: '0', endIndex: '27' }] },
            confidence: 0.95,
          },
          tokens: [
            token(0, 7, 0.99),    // "Section"
            token(8, 10, 0.98),   // "1."
            token(11, 27, 0.95),  // "Indemnification."
          ],
          detectedLanguages: [{ languageCode: 'en', confidence: 0.99 }],
        },
      ],
    };

    const out = mapDocAiDocumentsToOcrOutput([doc]);

    expect(out.driver).toBe('google_document_ai');
    expect(out.language).toBe('en');
    expect(out.pages).toHaveLength(1);
    expect(out.pages[0].text).toBe('Section 1. Indemnification.');
    expect(out.pages[0].confidence).toBeGreaterThan(0.95);
    expect(out.pages[0].confidence).toBeLessThan(1);
    expect(out.text).toBe('Section 1. Indemnification.');
  });

  it('computes char-length-weighted document confidence', () => {
    // Long page at 0.99, short page at 0.50 → doc-level should sit close to 0.99
    const longText = 'x'.repeat(1000);
    const shortText = 'y'.repeat(10);
    const docs: DocAiDocument[] = [
      {
        text: longText + '\n' + shortText,
        pages: [
          {
            pageNumber: 1,
            layout: {
              textAnchor: { textSegments: [{ startIndex: '0', endIndex: '1000' }] },
            },
            tokens: [token(0, 1000, 0.99)],
          },
          {
            pageNumber: 2,
            layout: {
              textAnchor: { textSegments: [{ startIndex: '1001', endIndex: '1011' }] },
            },
            tokens: [token(1001, 1011, 0.5)],
          },
        ],
      },
    ];

    const out = mapDocAiDocumentsToOcrOutput(docs);
    expect(out.confidence).toBeGreaterThan(0.97);
    expect(out.minPageConfidence).toBe(0.5);
  });

  it('falls back to page.layout.confidence when tokens are absent', () => {
    const doc: DocAiDocument = {
      text: 'Hello',
      pages: [
        {
          pageNumber: 1,
          layout: {
            textAnchor: { textSegments: [{ startIndex: '0', endIndex: '5' }] },
            confidence: 0.77,
          },
        },
      ],
    };
    const out = mapDocAiDocumentsToOcrOutput([doc]);
    expect(out.pages[0].confidence).toBe(0.77);
  });

  it('joins multiple Document AI responses (batch shards) into one OcrOutput', () => {
    // Batch path returns one Document per output shard; mapping joins them
    // in order, re-numbering pages contiguously.
    const docs: DocAiDocument[] = [
      {
        text: 'shard1',
        pages: [
          {
            pageNumber: 1,
            layout: { textAnchor: { textSegments: [{ startIndex: '0', endIndex: '6' }] } },
            tokens: [token(0, 6, 0.9)],
          },
        ],
      },
      {
        text: 'shard2',
        pages: [
          {
            pageNumber: 1, // local to this shard
            layout: { textAnchor: { textSegments: [{ startIndex: '0', endIndex: '6' }] } },
            tokens: [token(0, 6, 0.8)],
          },
        ],
      },
    ];

    const out = mapDocAiDocumentsToOcrOutput(docs);
    expect(out.pages).toHaveLength(2);
    expect(out.pages[0].pageNumber).toBe(1);
    expect(out.pages[1].pageNumber).toBe(2);
    expect(out.pages[0].text).toBe('shard1');
    expect(out.pages[1].text).toBe('shard2');
  });

  it('returns an empty output when there are no pages', () => {
    const out = mapDocAiDocumentsToOcrOutput([{ text: '', pages: [] }]);
    expect(out.pages).toHaveLength(0);
    expect(out.text).toBe('');
    expect(out.confidence).toBe(0);
    expect(out.language).toBe('en'); // fallback
  });

  it('handles string startIndex/endIndex (proto int64 serialization quirk)', () => {
    const doc: DocAiDocument = {
      text: 'Hello world',
      pages: [
        {
          pageNumber: 1,
          layout: {
            textAnchor: { textSegments: [{ startIndex: '0', endIndex: '11' }] },
          },
          tokens: [{ layout: { textAnchor: { textSegments: [{ startIndex: '0', endIndex: '11' }] }, confidence: 0.92 } }],
        },
      ],
    };
    const out = mapDocAiDocumentsToOcrOutput([doc]);
    expect(out.pages[0].text).toBe('Hello world');
    expect(out.pages[0].confidence).toBeCloseTo(0.92, 5);
  });
});
