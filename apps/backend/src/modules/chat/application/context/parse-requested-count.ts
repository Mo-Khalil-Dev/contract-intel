/**
 * Parses an explicit result count out of a question, e.g. "top 2 risky
 * contracts" → 2, "show me my 5 riskiest" → 5 (Phase 12).
 *
 * Pure and conservative: returns `null` when the question doesn't ask for
 * a specific number, in which case the caller keeps its default cap. Only
 * small counts are honoured (1–50) so a stray year or dollar figure in the
 * question doesn't get mistaken for a limit.
 */

const MAX_REQUESTED = 50;

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

// "top 2", "top two", "first 3", "5 riskiest", "three most risky",
// "list 2 contracts".
const PATTERNS: RegExp[] = [
  /\b(?:top|first|bottom|last)\s+(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
  /\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:most|riskiest|highest|contracts?|agreements?)\b/i,
];

export function parseRequestedCount(question: string): number | null {
  for (const pattern of PATTERNS) {
    const match = pattern.exec(question);
    if (!match) continue;
    const token = match[1].toLowerCase();
    const value = WORD_NUMBERS[token] ?? Number(token);
    if (Number.isFinite(value) && value >= 1 && value <= MAX_REQUESTED) {
      return value;
    }
  }
  return null;
}
