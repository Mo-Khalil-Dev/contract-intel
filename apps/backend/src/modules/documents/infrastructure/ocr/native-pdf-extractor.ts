import { Injectable } from '@nestjs/common';
import { loadPdfjs } from './pdfjs-loader';
import { computeTextQualityScore } from './text-quality-score';

export interface NativePageOutput {
  pageNumber: number;
  text: string;
  textQualityScore: number;
  /** Always 1.0 for native extraction — the PDF told us the bytes, we
   *  didn't guess. The textQualityScore is what flags genuinely garbled
   *  content (broken cmaps etc.). */
  confidence: number;
  driver: 'native_pdf';
}

/**
 * Extracts text from the digital pages of a PDF, using only pdfjs.
 *
 * Operates on the already-loaded pdf bytes (the classifier had to read
 * them too — see ClassifierThenRouter where we pass the buffer down).
 * For each requested page, walks the text-content items in operator
 * order, joining with positional whitespace inference (pdfjs already
 * inserts space tokens between text runs that were drawn apart).
 *
 * Returns one entry per requested page. Pages classified as `blank` or
 * `scanned` upstream are NOT in the request set — those go elsewhere.
 */
@Injectable()
export class NativePdfExtractor {
  async extractPages(
    pdfBytes: Uint8Array,
    pageNumbers: number[],
  ): Promise<NativePageOutput[]> {
    if (pageNumbers.length === 0) return [];

    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;

    const out: NativePageOutput[] = [];
    for (const n of pageNumbers) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => {
          if (item && typeof item === 'object' && 'str' in item) {
            return (item as { str?: string }).str ?? '';
          }
          return '';
        })
        .join(' ')
        .replace(/[ \t]+/g, ' ')
        .trim();

      out.push({
        pageNumber: n,
        text,
        textQualityScore: computeTextQualityScore(text),
        confidence: 1,
        driver: 'native_pdf',
      });
    }
    return out;
  }
}
