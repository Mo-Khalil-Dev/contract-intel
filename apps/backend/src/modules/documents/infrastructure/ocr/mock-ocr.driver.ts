import { Injectable } from '@nestjs/common';
import { IOcrService, OcrInput, OcrOutput } from '../../domain/ports/ocr-service.port';

/**
 * Deterministic fixture OCR driver.
 *
 * Used in tests, local dev, and as the fallback when `OCR_DRIVER` is
 * `mock`. Always returns the same single-page result regardless of input.
 *
 * The cloud-track slot in `ClassifierThenRouter` is filled by this in
 * dev so the pipeline still runs end-to-end on scanned PDFs — you just
 * get fixture text rather than real OCR. Pre-Task 7.4 default.
 */
@Injectable()
export class MockOcrDriver implements IOcrService {
  extractText(_input: OcrInput): Promise<OcrOutput> {
    void _input;
    const text =
      'Section 1. Indemnification. The Seller shall indemnify and hold harmless ' +
      'the Buyer from any claims arising out of this Agreement.';
    return Promise.resolve({
      text,
      pages: [
        {
          pageNumber: 1,
          text,
          confidence: 0.85,
          textQualityScore: 0.95,
          driver: 'mock',
        },
      ],
      confidence: 0.85,
      minPageConfidence: 0.85,
      language: 'en',
      driver: 'mock',
    });
  }
}
