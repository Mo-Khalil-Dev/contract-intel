import { GENERAL_QUERY_TYPE, QueryType } from '../../domain/query-type';

/**
 * Heuristic, side-effect-free classifier (Phase 12, Task 12.1).
 *
 * Maps a plain-English question to one of the seven {@link QueryType}s by
 * keyword scoring. We start heuristic (not LLM) on purpose — it's
 * deterministic, instant, free, and trivially unit-testable; an
 * LLM-backed classifier is an open question for later (see the handoff).
 *
 * Each type carries a list of signal phrases. The question is scored
 * against every type; the highest score wins. Ties and zero-score
 * questions fall back to `general`. `document-specific` gets a small
 * boost when the question quotes a contract name in quotes or "the X
 * contract" form, since those phrasings otherwise look generic.
 */

interface TypeSignals {
  type: QueryType;
  keywords: string[];
}

const SIGNALS: TypeSignals[] = [
  {
    type: 'risk-analysis',
    keywords: [
      'risk',
      'risky',
      'unlimited liability',
      'liability',
      'exposure',
      'critical',
      'red flag',
      'flagged',
      'dangerous',
      'concern',
      'uncapped',
    ],
  },
  {
    type: 'comparison',
    keywords: [
      'compare',
      'comparison',
      'versus',
      ' vs ',
      'difference between',
      'differ',
      'which is better',
      'side by side',
    ],
  },
  {
    type: 'timeline',
    keywords: [
      'when',
      'expire',
      'expiry',
      'expiration',
      'renew',
      'renewal',
      'deadline',
      'termination date',
      'end date',
      'upcoming',
      'due',
      'date',
    ],
  },
  {
    type: 'clause-type-search',
    keywords: [
      'clause',
      'clauses',
      'indemnification',
      'indemnity',
      'confidentiality',
      'non-compete',
      'governing law',
      'arbitration',
      'find all',
      'which contracts have',
      'show me contracts with',
    ],
  },
  {
    type: 'financial',
    keywords: [
      'payment',
      'price',
      'pricing',
      'cost',
      'fee',
      'fees',
      'value',
      'amount',
      'total',
      'spend',
      'revenue',
      'how much',
      '$',
    ],
  },
  {
    type: 'document-specific',
    keywords: [
      'in the ',
      'this contract',
      'that contract',
      'the agreement with',
      'summarize',
      'summary of',
      'tell me about',
    ],
  },
];

/** Count how many of a type's keywords appear in the normalised question. */
function scoreType(question: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    if (question.includes(kw)) score += 1;
  }
  return score;
}

/**
 * Classify a question. Pure — no IO, no throw. Always returns a type;
 * `general` when nothing scores.
 */
export function classifyQuery(rawQuestion: string): QueryType {
  const question = ` ${rawQuestion.toLowerCase().trim()} `;

  // A quoted name or "the … contract/agreement" phrasing is a strong
  // document-specific tell that bare keywords miss.
  const namesADocument =
    /["“'].+["”']/.test(rawQuestion) ||
    /\bthe\s+[\w &-]+\s+(contract|agreement|msa|sow)\b/i.test(rawQuestion);

  let best: QueryType = GENERAL_QUERY_TYPE;
  let bestScore = 0;

  for (const { type, keywords } of SIGNALS) {
    let score = scoreType(question, keywords);
    if (type === 'document-specific' && namesADocument) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  return bestScore === 0 ? GENERAL_QUERY_TYPE : best;
}
