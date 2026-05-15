import { Injectable } from '@nestjs/common';

// ESM-from-CJS trick — see pdfjs-loader.ts for the same pattern. ts-jest
// would otherwise rewrite `await import()` into a require() that fails
// on the ESM-only franc-min build. `eval` keeps the import opaque to
// both the TS compiler and jest's transform.
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
const dynamicImport = eval('(spec) => import(spec)') as (
  spec: string,
) => Promise<unknown>;

/**
 * Language detection wrapper around `franc-min`.
 *
 * `francAll` returns an array of `[ISO 639-3, score]` pairs with the top
 * result always at 1.0. The useful signal is the *gap* between the top
 * and second match — a clean English contract scores `eng: 1.0, deu: 0.6`
 * for a gap of 0.4; a mixed-language doc scores `eng: 1.0, fra: 0.95`
 * for a gap of 0.05.
 *
 * The pipeline's accept/reject rules live one layer up (ClassifierThenRouter);
 * this class is a pure adapter that hands back `(language, confidenceGap)`.
 *
 * See ocr-design.md §5 "Language detection — how it actually works".
 */

export interface DetectionResult {
  /** ISO 639-1 code, or 'und' when the sample is too short / inconclusive. */
  language: string;
  /** Gap between top and second-best franc score. 1.0 if only one result. */
  confidenceGap: number;
}

export const UNDETERMINED_LANGUAGE = 'und';

// Minimum sample size franc needs for a meaningful classification. Less
// than this and we return 'und' without bothering franc — most often hit
// on pure-scanned PDFs where the pdfjs probe found no text.
const FRANC_MIN_LENGTH = 200;

// Map of ISO 639-3 → 639-1 for the languages we plausibly see. Anything
// else round-trips through 639-3 untouched; the pipeline rejects it
// against the OCR_LANGUAGES allowlist anyway.
const ISO_639_3_TO_1: Record<string, string> = {
  eng: 'en',
  fra: 'fr',
  deu: 'de',
  spa: 'es',
  ita: 'it',
  nld: 'nl',
  por: 'pt',
  rus: 'ru',
  cmn: 'zh',
  jpn: 'ja',
};

@Injectable()
export class LanguageDetector {
  async detect(sample: string): Promise<DetectionResult> {
    if (!sample || sample.replace(/\s+/g, '').length < FRANC_MIN_LENGTH) {
      return { language: UNDETERMINED_LANGUAGE, confidenceGap: 0 };
    }

    const francModule = (await dynamicImport('franc-min')) as {
      francAll: (s: string, opts?: { minLength?: number }) => Array<[string, number]>;
    };
    const results = francModule.francAll(sample, { minLength: FRANC_MIN_LENGTH });

    if (results.length === 0 || results[0][0] === UNDETERMINED_LANGUAGE) {
      return { language: UNDETERMINED_LANGUAGE, confidenceGap: 0 };
    }

    const topCode = ISO_639_3_TO_1[results[0][0]] ?? results[0][0];
    const gap =
      results.length >= 2 ? Math.max(0, results[0][1] - results[1][1]) : 1;
    return { language: topCode, confidenceGap: gap };
  }
}
