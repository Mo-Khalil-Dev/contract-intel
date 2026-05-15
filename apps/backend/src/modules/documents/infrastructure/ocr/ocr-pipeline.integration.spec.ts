import { promises as fs } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { ClassifierThenRouter } from './classifier-then-router';
import { LanguageDetector } from './language-detector';
import { MockOcrDriver } from './mock-ocr.driver';
import { NativePdfExtractor } from './native-pdf-extractor';
import { PdfClassifier } from './pdf-classifier';

const FIXTURE = join(
  __dirname,
  '../../../../../test/fixtures/ocr/born-digital-sample.pdf',
);

/**
 * End-to-end pipeline test against a real born-digital PDF. Exercises the
 * dynamic ESM imports (pdfjs-dist, franc-min) from a CommonJS test runner —
 * the highest-risk piece of Task 7.3 because ESM-from-CJS fails at runtime,
 * not at compile time.
 */
describe('OCR pipeline (integration)', () => {
  let bytes: Buffer;

  beforeAll(async () => {
    bytes = await fs.readFile(FIXTURE);
  });

  it('classifies a real born-digital PDF as all-digital', async () => {
    const classifier = new PdfClassifier();
    const result = await classifier.classify(Readable.from([bytes]));
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.perPageClassification.every((c) => c === 'digital')).toBe(true);
    expect(result.earlyTextSample.length).toBeGreaterThan(0);
  });

  it('runs the full pipeline → native_pdf driver, confidence 1.0', async () => {
    const router = new ClassifierThenRouter(
      new PdfClassifier(),
      new LanguageDetector(),
      new NativePdfExtractor(),
      new MockOcrDriver(),
      /* pageLimit */ 200,
      /* qualityThreshold */ 0.5,
      /* languageConfidenceThreshold */ 0.1,
    );

    const out = await router.extractText({
      documentId: 'integration-test',
      source: Readable.from([bytes]),
      mimeType: 'application/pdf',
      languages: ['en'],
    });

    expect(out.driver).toBe('native_pdf');
    expect(out.pages.length).toBeGreaterThan(0);
    expect(out.confidence).toBe(1);
    expect(out.text.length).toBeGreaterThan(100);
    expect(out.language).toBe('en');
  }, 20_000);
});
