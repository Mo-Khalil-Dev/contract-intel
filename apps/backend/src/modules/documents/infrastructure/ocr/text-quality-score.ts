/**
 * `textQualityScore` — 0..1 heuristic to detect garbled native-extracted text.
 *
 * Driver-extracted text *can* be garbage even when the classifier says
 * "digital page": broken ToUnicode cmaps, exotic font encodings, font
 * subsetting bugs. The score is built from three orthogonal signals so
 * any one failure mode tilts the result heavily:
 *
 *   - Dictionary-word ratio (50% weight) — fraction of word-shaped tokens
 *     that appear in the English wordlist. Real legal text scores 0.6–0.85;
 *     gibberish scores under 0.1.
 *   - Basic-Latin ratio (30%) — fraction of letters in the ASCII Latin
 *     block. English contract text is ~0.99 here.
 *   - Penalty for Private-Use-Area chars (-20% weight) — `U+E000..U+F8FF`
 *     is where broken cmaps dump output; > 0 anywhere is a red flag.
 *   - Replacement-character density (subtractive) — `U+FFFD` means the
 *     extractor literally gave up on that codepoint.
 *
 * The English wordlist is loaded lazily (≈200 KB) on first call and cached.
 * For non-English documents, the language detector rejects up front, so
 * this scorer is only ever called on text we believe is English.
 */

let englishWordSet: Set<string> | null = null;

function getWordSet(): Set<string> {
  if (englishWordSet) return englishWordSet;
  // CommonJS-friendly. wordlist-english exposes `english` (all dialects)
  // plus per-dialect arrays. `english` is plenty for our purposes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const wordlist = require('wordlist-english') as Record<string, string[]>;
  const all = [
    ...(wordlist['english'] ?? []),
    ...(wordlist['english/american'] ?? []),
    ...(wordlist['english/british'] ?? []),
  ];
  englishWordSet = new Set(all.map((w) => w.toLowerCase()));
  return englishWordSet;
}

export function computeTextQualityScore(text: string): number {
  if (text.length === 0) return 0;

  const chars = [...text];
  const letters = chars.filter((c) => /\p{L}/u.test(c));
  if (letters.length < 50) {
    // Too short to judge reliably — default optimistic so we don't
    // wrongly demote a sparse-but-real page to cloud OCR.
    return 0.7;
  }

  const inBasicLatin =
    letters.filter((c) => c.codePointAt(0)! < 0x100).length / letters.length;
  const inPrivateUse =
    letters.filter((c) => {
      const cp = c.codePointAt(0)!;
      return cp >= 0xe000 && cp < 0xf900;
    }).length / letters.length;
  const replacementCh =
    chars.filter((c) => c === '\uFFFD').length / chars.length;

  const wordSet = getWordSet();
  const words = text.toLowerCase().match(/[a-z]{2,}/g) ?? [];
  const dictRatio =
    words.length === 0 ? 0 : words.filter((w) => wordSet.has(w)).length / words.length;

  const score =
    0.5 * dictRatio +
    0.3 * inBasicLatin -
    0.2 * inPrivateUse -
    1.0 * replacementCh;

  return Math.max(0, Math.min(1, score));
}
