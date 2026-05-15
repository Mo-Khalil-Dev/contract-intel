import type { OcrOutput, OcrPageOutput } from '../../domain/ports/ocr-service.port';

/**
 * Pure transform: Document AI's `Document` response → our `OcrOutput`.
 *
 * Lives in its own file so we can unit-test it without spinning up the
 * driver, the SDK, or any auth. The driver (sync or batch) reduces to:
 * "fetch the Document(s), call this function, return the result."
 *
 * Document AI shape (relevant fields):
 *   document.text                  one giant string for the whole document
 *   document.pages[].pageNumber
 *   document.pages[].layout.confidence
 *   document.pages[].tokens[].layout.confidence
 *   document.pages[].tokens[].layout.textAnchor.textSegments[]
 *   document.pages[].detectedLanguages[].languageCode
 *
 * Everything else (paragraphs, lines, blocks, tables, entities) is
 * ignored — they're redundant with tokens at the granularity we need.
 *
 * See ocr-design.md §"Mapping back to OcrOutput" for the design notes.
 */

// Minimal, loose types — Document AI's protobuf-generated types are
// vast and the response is a trust boundary anyway. We pluck what we
// need and ignore the rest.
export interface DocAiDocument {
  text?: string | null;
  pages?: DocAiPage[];
}

export interface DocAiPage {
  pageNumber?: number | null;
  layout?: DocAiLayout;
  tokens?: DocAiToken[];
  detectedLanguages?: Array<{ languageCode?: string | null; confidence?: number | null }>;
}

export interface DocAiToken {
  layout?: DocAiLayout;
  detectedBreak?: { type?: string | null };
}

export interface DocAiLayout {
  textAnchor?: {
    textSegments?: Array<{
      startIndex?: string | number | null;
      endIndex?: string | number | null;
    }>;
  };
  confidence?: number | null;
}

/**
 * Build an `OcrOutput` from one or more Document AI `Document` responses.
 *
 * `documents` is one entry per processor response we received — sync mode
 * yields one, batch mode yields one per output shard (Document AI splits
 * large batch jobs across files). They are joined in order: the first
 * document's `pages` start at pageNumber 1, the next continues from there,
 * and so on. Document AI guarantees pageNumber within each Document is
 * 1-indexed and contiguous.
 */
export function mapDocAiDocumentsToOcrOutput(
  documents: DocAiDocument[],
  fallbackLanguage = 'en',
): OcrOutput {
  const pages: OcrPageOutput[] = [];
  const textParts: string[] = [];
  let pageOffset = 0;
  let detectedLanguage: string | undefined;

  for (const doc of documents) {
    const docText = doc.text ?? '';
    textParts.push(docText);

    for (const page of doc.pages ?? []) {
      const pageNumber = (page.pageNumber ?? 0) + pageOffset || pageOffset + pages.length + 1;
      const pageText = sliceText(docText, page.layout);
      const confidence = computePageConfidence(docText, page);
      pages.push({
        pageNumber,
        text: pageText,
        confidence,
        // textQualityScore is a native-extractor concept (does the extracted
        // text look like real English?). Document AI's recognition confidence
        // already covers "did we read it correctly"; quality is moot when
        // we trust the engine, so mirror confidence here.
        textQualityScore: confidence,
        driver: 'google_document_ai',
      });

      const lang = page.detectedLanguages?.find((l) => l.languageCode)?.languageCode;
      if (lang && !detectedLanguage) detectedLanguage = lang;
    }

    pageOffset += (doc.pages ?? []).length;
  }

  if (pages.length === 0) {
    return {
      text: '',
      pages: [],
      confidence: 0,
      minPageConfidence: 0,
      language: detectedLanguage ?? fallbackLanguage,
      driver: 'google_document_ai',
    };
  }

  // Document-level confidence: char-length-weighted mean. A noisy single
  // page can't drag down a long contract — same rule as the orchestrator.
  let totalChars = 0;
  let weighted = 0;
  for (const p of pages) {
    const len = p.text.length || 1;
    totalChars += len;
    weighted += p.confidence * len;
  }
  const docConfidence = weighted / totalChars;
  const minPageConfidence = Math.min(...pages.map((p) => p.confidence));

  return {
    text: textParts.join('\n\n'),
    pages,
    confidence: docConfidence,
    minPageConfidence,
    language: detectedLanguage ?? fallbackLanguage,
    driver: 'google_document_ai',
  };
}

function sliceText(fullText: string, layout: DocAiLayout | undefined): string {
  const segments = layout?.textAnchor?.textSegments ?? [];
  if (segments.length === 0) return '';
  return segments
    .map((s) => fullText.slice(toIndex(s.startIndex), toIndex(s.endIndex, fullText.length)))
    .join('');
}

function toIndex(v: string | number | null | undefined, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Token-weighted mean confidence for a page. Each token's confidence is
 * weighted by the number of characters it represents (a 12-char token
 * counts more than a 2-char one). Falls back to the page-level layout
 * confidence when tokens are absent.
 */
function computePageConfidence(fullText: string, page: DocAiPage): number {
  const tokens = page.tokens ?? [];
  if (tokens.length === 0) {
    return page.layout?.confidence ?? 0;
  }
  let weighted = 0;
  let total = 0;
  for (const t of tokens) {
    const seg = t.layout?.textAnchor?.textSegments?.[0];
    if (!seg) continue;
    const start = toIndex(seg.startIndex);
    const end = toIndex(seg.endIndex, fullText.length);
    const len = Math.max(end - start, 1);
    const c = t.layout?.confidence ?? 0;
    weighted += c * len;
    total += len;
  }
  return total === 0 ? 0 : weighted / total;
}
