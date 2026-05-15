import { Inject, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import {
  IOcrService,
  OcrInput,
  OcrOutput,
  OcrPageOutput,
} from '../../domain/ports/ocr-service.port';
import { OcrPermanentError } from '../../application/ocr/ocr-errors';
import { LanguageDetector } from './language-detector';
import { NativePdfExtractor, NativePageOutput } from './native-pdf-extractor';
import { PdfClassifier, PdfClassification } from './pdf-classifier';

export const OCR_PAGE_LIMIT = 'OCR_PAGE_LIMIT';
export const OCR_TEXT_QUALITY_THRESHOLD = 'OCR_TEXT_QUALITY_THRESHOLD';
export const OCR_LANGUAGE_CONFIDENCE_THRESHOLD =
  'OCR_LANGUAGE_CONFIDENCE_THRESHOLD';
export const OCR_CLOUD_DRIVER = 'OCR_CLOUD_DRIVER';

/**
 * The IOcrService implementation. Composes:
 *
 *   1. Read PDF bytes into memory (needed by both classifier and extractor).
 *   2. Classify pages: digital | scanned | blank.
 *   3. Detect language on the early text sample. Reject non-allowlisted
 *      languages with high confidence; accept ambiguous results.
 *   4. Reject if pageCount > OCR_PAGE_LIMIT.
 *   5. Route per-page:
 *        - digital → NativePdfExtractor
 *        - scanned → cloudDriver (mock in dev / Document AI in prod / 7.4)
 *        - blank   → empty PageText with confidence 1.0
 *   6. Quality-demote: digital pages with textQualityScore below the
 *      threshold get rerun through the cloud driver.
 *   7. Merge: assemble per-page outputs into one OcrOutput. Document-level
 *      driver is `native_pdf | google_document_ai | mock | hybrid`.
 *
 * See ocr-design.md §5 "Pipeline walkthrough" for the narrative version.
 */
@Injectable()
export class ClassifierThenRouter implements IOcrService {
  private readonly logger = new Logger(ClassifierThenRouter.name);

  constructor(
    private readonly classifier: PdfClassifier,
    private readonly languageDetector: LanguageDetector,
    private readonly native: NativePdfExtractor,
    @Inject(OCR_CLOUD_DRIVER) private readonly cloud: IOcrService,
    @Inject(OCR_PAGE_LIMIT) private readonly pageLimit: number,
    @Inject(OCR_TEXT_QUALITY_THRESHOLD) private readonly qualityThreshold: number,
    @Inject(OCR_LANGUAGE_CONFIDENCE_THRESHOLD)
    private readonly languageConfidenceThreshold: number,
  ) {}

  async extractText(input: OcrInput): Promise<OcrOutput> {
    // Step 1 — slurp bytes once. Streams aren't re-consumable, and both
    // classifier and extractor need them. PDFs ≤50 MB; memory is fine.
    const bytes = await readAllBytes(input.source);

    // Step 2 — classify. We hand pdfjs a *copy* because pdfjs transfers
    // the underlying ArrayBuffer to a worker, which detaches it. Any
    // later consumer (the extractor below, or a cloud driver) would
    // then fail with `DataCloneError`. The defensive copy costs one
    // memcpy of ≤50 MB — negligible vs. the OCR work that follows.
    const classification = await this.classifier.classifyBytes(new Uint8Array(bytes));

    // Step 3 — language gate.
    await this.assertLanguageAllowed(classification.earlyTextSample, input.languages);

    // Step 4 — page cap.
    if (classification.pageCount > this.pageLimit) {
      throw new OcrPermanentError(
        'too_many_pages',
        `Document has ${classification.pageCount} pages, limit is ${this.pageLimit}`,
      );
    }

    // Step 5 — route.
    const digitalIdxs: number[] = [];
    const scannedIdxs: number[] = [];
    classification.perPageClassification.forEach((c, i) => {
      const pageNumber = i + 1;
      if (c === 'digital') digitalIdxs.push(pageNumber);
      else if (c === 'scanned') scannedIdxs.push(pageNumber);
      // blank handled at merge time
    });

    const nativePages = await this.native.extractPages(
      new Uint8Array(bytes),
      digitalIdxs,
    );

    // Step 6 — quality demotion. Any native page below the threshold
    // joins the scanned set for a cloud re-extraction.
    const demoted: number[] = [];
    const keptNative: NativePageOutput[] = [];
    for (const page of nativePages) {
      if (page.textQualityScore < this.qualityThreshold && page.text.length > 0) {
        demoted.push(page.pageNumber);
      } else {
        keptNative.push(page);
      }
    }
    const cloudPageNumbers = [...scannedIdxs, ...demoted].sort((a, b) => a - b);

    // Cloud track — call only if there's anything to OCR. We pass the
    // *whole document* through (the IOcrService port wants a stream);
    // future cloud drivers may slice by page internally. The hints let
    // the Document AI driver pick sync vs batch without re-counting.
    const cloudOutput =
      cloudPageNumbers.length > 0
        ? await this.cloud.extractText({
            documentId: input.documentId,
            source: Readable.from([bytes]),
            mimeType: input.mimeType,
            languages: input.languages,
            pageCountHint: classification.pageCount,
            byteSizeHint: bytes.length,
          })
        : null;

    // Step 7 — merge.
    const merged = this.mergePages(
      classification,
      keptNative,
      cloudOutput,
      cloudPageNumbers,
    );
    const fullText = merged.map((p) => p.text).join('\n\n');
    const docDriver = pickDocumentDriver(merged);
    const weighted = weightedConfidence(merged);
    const minConf = Math.min(...merged.map((p) => p.confidence));

    this.logger.log(
      `OCR done for ${input.documentId}: pages=${merged.length}, driver=${docDriver}, conf=${weighted.toFixed(3)}`,
    );

    return {
      text: fullText,
      pages: merged,
      confidence: weighted,
      minPageConfidence: minConf,
      language: 'en', // language gate has already accepted or thrown
      driver: docDriver,
    };
  }

  private async assertLanguageAllowed(
    sample: string,
    allowedLanguages: string[],
  ): Promise<void> {
    const detection = await this.languageDetector.detect(sample);
    // Sample too short / inconclusive → accept; downstream textQuality
    // is the safety net.
    if (detection.language === 'und') return;

    const isAllowed = allowedLanguages.includes(detection.language);
    if (!isAllowed && detection.confidenceGap >= this.languageConfidenceThreshold) {
      throw new OcrPermanentError(
        `unsupported_language:${detection.language}`,
        `Detected language ${detection.language} is not in the allowlist [${allowedLanguages.join(',')}]`,
      );
    }
    // Allowed, OR not allowed but ambiguous (low confidence) → proceed.
  }

  private mergePages(
    classification: PdfClassification,
    nativePages: NativePageOutput[],
    cloudOutput: OcrOutput | null,
    cloudPageNumbers: number[],
  ): OcrPageOutput[] {
    const byPage = new Map<number, OcrPageOutput>();

    for (const np of nativePages) {
      byPage.set(np.pageNumber, {
        pageNumber: np.pageNumber,
        text: np.text,
        confidence: np.confidence,
        textQualityScore: np.textQualityScore,
        driver: 'native_pdf',
      });
    }

    if (cloudOutput && cloudPageNumbers.length > 0) {
      // Cloud driver doesn't (yet) know per-page numbers we requested —
      // its `pages` are sequential 1..N over the input. Map them onto
      // the page numbers we wanted, in order. Mock returns 1 page; the
      // real Document AI driver in 7.4 returns one per input page.
      cloudOutput.pages.forEach((cp, i) => {
        const targetPageNumber = cloudPageNumbers[i] ?? cp.pageNumber;
        byPage.set(targetPageNumber, {
          pageNumber: targetPageNumber,
          text: cp.text,
          confidence: cp.confidence,
          textQualityScore: cp.textQualityScore,
          driver: cp.driver,
        });
      });
    }

    // Fill blanks (and any pages no driver covered) with empty text.
    const merged: OcrPageOutput[] = [];
    for (let i = 1; i <= classification.pageCount; i++) {
      merged.push(
        byPage.get(i) ?? {
          pageNumber: i,
          text: '',
          confidence: 1,
          textQualityScore: 1,
          driver: 'native_pdf',
        },
      );
    }
    return merged;
  }
}

function pickDocumentDriver(pages: OcrPageOutput[]): OcrOutput['driver'] {
  const nonBlank = pages.filter((p) => p.text.length > 0);
  if (nonBlank.length === 0) return 'native_pdf';
  const drivers = new Set(nonBlank.map((p) => p.driver));
  if (drivers.size === 1) return [...drivers][0] as OcrOutput['driver'];
  return 'hybrid';
}

function weightedConfidence(pages: OcrPageOutput[]): number {
  let weight = 0;
  let weighted = 0;
  for (const p of pages) {
    const len = p.text.length;
    weight += len;
    weighted += p.confidence * len;
  }
  return weight === 0 ? 1 : weighted / weight;
}

async function readAllBytes(source: Readable): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of source) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return new Uint8Array(Buffer.concat(chunks));
}
