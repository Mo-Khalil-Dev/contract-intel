import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { loadPdfjs, PdfDocument } from './pdfjs-loader';

export type PageClassification = 'digital' | 'scanned' | 'blank';

export interface PdfClassification {
  pageCount: number;
  perPageClassification: PageClassification[];
  /** First-pages text sample (up to ~4 KB), for downstream LanguageDetector. */
  earlyTextSample: string;
}

/**
 * Per-page text-vs-image classifier built on pdfjs.
 *
 * For each page we count two cheap signals:
 *   - `charCount`: non-whitespace characters from text-showing operators
 *     (Tj/TJ/'/"). Decoded via the font's ToUnicode cmap — so missing
 *     cmaps appear as garbage but still register as characters. The
 *     downstream textQualityScore catches that.
 *   - `hasLargeImage`: presence of `paintImageXObject` operators, i.e.
 *     a raster XObject drawn onto the page.
 *
 * The thresholds match ocr-design.md §5 step 4:
 *   - ≥100 chars            → digital
 *   - <100 chars + image    → scanned
 *   - <100 chars + no image → blank
 */
@Injectable()
export class PdfClassifier {
  private static readonly DIGITAL_CHAR_THRESHOLD = 100;
  private static readonly SAMPLE_MAX_BYTES = 4096;

  async classify(source: Readable): Promise<PdfClassification> {
    const bytes = await readAllBytes(source);
    return this.classifyBytes(bytes);
  }

  /**
   * Classify when bytes are already in memory. Used by the orchestrator,
   * which reads the PDF once and shares the buffer with both the
   * classifier and the native extractor.
   */
  async classifyBytes(bytes: Uint8Array): Promise<PdfClassification> {
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    return this.classifyDocument(doc, pdfjs.OPS);
  }

  private async classifyDocument(
    doc: PdfDocument,
    OPS: Record<string, number>,
  ): Promise<PdfClassification> {
    // pdfjs op-code names that paint a raster image. Some pdfjs versions
    // expose `paintJpegXObject` separately, hence the lookup-with-fallback.
    const imageOps = new Set(
      [OPS.paintImageXObject, OPS.paintJpegXObject, OPS.paintImageMaskXObject]
        .filter((n): n is number => typeof n === 'number'),
    );

    const perPage: PageClassification[] = [];
    let sample = '';

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => {
          if (item && typeof item === 'object' && 'str' in item) {
            return (item as { str?: string }).str ?? '';
          }
          return '';
        })
        .join(' ');
      const nonWs = text.replace(/\s+/g, '');

      let hasLargeImage = false;
      if (imageOps.size > 0) {
        const ops = await page.getOperatorList();
        hasLargeImage = ops.fnArray.some((fn) => imageOps.has(fn));
      }

      let classification: PageClassification;
      if (nonWs.length >= PdfClassifier.DIGITAL_CHAR_THRESHOLD) {
        classification = 'digital';
      } else if (hasLargeImage) {
        classification = 'scanned';
      } else {
        classification = 'blank';
      }
      perPage.push(classification);

      // Build up to 4 KB of sample text for the language detector. Stop
      // early once we have enough — no point reading 200 pages.
      if (sample.length < PdfClassifier.SAMPLE_MAX_BYTES && text.length > 0) {
        sample +=
          (sample.length === 0 ? '' : '\n') +
          text.slice(0, PdfClassifier.SAMPLE_MAX_BYTES - sample.length);
      }
    }

    return {
      pageCount: doc.numPages,
      perPageClassification: perPage,
      earlyTextSample: sample,
    };
  }
}

async function readAllBytes(source: Readable): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of source) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return new Uint8Array(Buffer.concat(chunks));
}
