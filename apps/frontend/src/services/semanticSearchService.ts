/**
 * semanticSearchService — Phase 11 US-CI-2 mock implementation.
 *
 * v1 returns curated, hand-scripted results for the four canonical
 * suggested queries plus a generic fallback for everything else. When
 * the real backend lands, replace the body of `search()` with a single
 * `httpService.get(API.SEARCH, { params })` call — every component
 * downstream consumes the same `SemanticSearchResponse` shape.
 *
 * Why curated mocks (not random):
 *   - Lets the team rehearse the demo against known-good results.
 *   - Surfaces the empty / low-confidence states deterministically.
 *   - Keeps the UX flow honest about latency (a 350ms simulated
 *     delay matches the rough order of a HyDE-rewrite + kNN round
 *     trip in production).
 */

import type {
  ClauseSearchResult,
  ContractSearchResult,
  SemanticSearchOptions,
  SemanticSearchResponse,
} from '@/types/semanticSearch';

export const SUGGESTED_QUERIES = [
  'contracts with unlimited liability',
  'auto-renewal clauses with short notice periods',
  'NDAs signed in the last 90 days',
  'termination rights that favour the counterparty',
] as const;

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

// ── Curated demo data ──────────────────────────────────────────────

const CANNED: Record<
  string,
  { confidence: number; contracts: ContractSearchResult[]; clauses: ClauseSearchResult[] }
> = {
  'contracts with unlimited liability': {
    confidence: 0.91,
    contracts: [
      {
        id: 'mock-contract-1',
        score: 0.91,
        contract: {
          id: '4b34c764-0dff-49bf-b3f5-d04488ecf9c4',
          name: 'SaaS Vendor — Risky Variant',
          type: 'MSA',
          counterparty: 'Acme Inc.',
          signedAt: '2026-04-12T00:00:00.000Z',
          dealSize: '$2.4M',
        },
        matchedOn: {
          label: 'Limitation of Liability',
          section: '§9.2',
          text: "Vendor's liability under this Agreement shall be unlimited for any breach. Buyer accepts no cap on damages, consequential or otherwise.",
        },
      },
      {
        id: 'mock-contract-2',
        score: 0.78,
        contract: {
          id: '90d3eee3-2319-4439-82d5-19925820a22e',
          name: 'Globex MSA',
          type: 'MSA',
          counterparty: 'Globex Corp.',
          signedAt: '2026-03-14T00:00:00.000Z',
          dealSize: '$1.1M',
        },
        matchedOn: {
          label: 'Indemnification',
          section: '§11.1',
          text: 'Buyer shall defend, indemnify, and hold harmless Vendor from any and all claims arising under this Agreement, without cap or limitation.',
        },
      },
      {
        id: 'mock-contract-3',
        score: 0.66,
        contract: {
          id: '785ac55a-2915-470f-b91b-859a209c3168',
          name: 'Initech Master Services',
          type: 'MSA',
          counterparty: 'Initech Ltd.',
          signedAt: '2026-02-01T00:00:00.000Z',
          dealSize: '$480K',
        },
        matchedOn: {
          label: 'Limitation of Liability',
          section: '§8.4',
          text: 'Neither party shall be liable for any indirect, consequential, or punitive damages, except in cases of gross negligence or willful misconduct.',
        },
      },
    ],
    clauses: [
      lolClause('cl-mock-1', 0.89, '4b34c764-0dff-49bf-b3f5-d04488ecf9c4', 'SaaS Vendor — Risky Variant',
        "Vendor's liability under this Agreement shall be unlimited for any breach."),
      lolClause('cl-mock-2', 0.81, '90d3eee3-2319-4439-82d5-19925820a22e', 'Globex MSA',
        'No cap on damages, consequential or otherwise; mutual indemnification waived.'),
      lolClause('cl-mock-3', 0.74, 'c793c7e2-d2a5-4613-9dfc-7bb047824c62', 'Hooli Order Form',
        'The cap on liability set forth in §8 shall not apply to claims arising under this Section.'),
      lolClause('cl-mock-4', 0.62, '7182bf86-ee8e-4d8f-9771-dc2c812a609e', 'SaaS Vendor — Balanced Variant',
        "Each party's liability shall not exceed amounts paid in the twelve months preceding the claim."),
      lolClause('cl-mock-5', 0.58, '54ad2c76-15df-4305-b833-ea8aa4247754', 'Stark Industries MSA',
        'Liability is uncapped solely with respect to a Party’s indemnification obligations.'),
    ],
  },
  'auto-renewal clauses with short notice periods': {
    confidence: 0.84,
    contracts: [
      contractRow('mock-ar-1', 0.84, '4b34c764-0dff-49bf-b3f5-d04488ecf9c4', 'SaaS Vendor — Risky Variant',
        'Acme Inc.', '$2.4M', '2026-04-12', 'Auto-Renewal', '§3.2',
        'This Agreement shall automatically renew for successive one-year terms unless either party gives 15 days written notice prior to the renewal date.'),
      contractRow('mock-ar-2', 0.72, '7182bf86-ee8e-4d8f-9771-dc2c812a609e', 'Hooli Order Form',
        'Hooli LLC', '$680K', '2026-01-18', 'Auto-Renewal', '§4.1',
        'The initial term shall automatically extend for additional twelve-month periods unless terminated by either party with thirty (30) days notice.'),
    ],
    clauses: [
      genericClause('cl-ar-1', 0.84, 'auto_renewal', '§3.2',
        '4b34c764-0dff-49bf-b3f5-d04488ecf9c4', 'SaaS Vendor — Risky Variant',
        'This Agreement shall automatically renew for successive one-year terms unless either party gives 15 days written notice prior to the renewal date.'),
      genericClause('cl-ar-2', 0.72, 'auto_renewal', '§4.1',
        '7182bf86-ee8e-4d8f-9771-dc2c812a609e', 'Hooli Order Form',
        'The initial term shall automatically extend for additional twelve-month periods unless terminated by either party with thirty (30) days notice.'),
      genericClause('cl-ar-3', 0.61, 'term', '§2.1',
        'c793c7e2-d2a5-4613-9dfc-7bb047824c62', 'Stark Industries MSA',
        'The Agreement shall remain in effect for an initial term of two (2) years and shall renew automatically thereafter.'),
    ],
  },
  'ndas signed in the last 90 days': {
    confidence: 0.42, // low — triggers banner
    contracts: [
      contractRow('mock-nda-1', 0.42, '785ac55a-2915-470f-b91b-859a209c3168', 'Initech Mutual NDA',
        'Initech Ltd.', '—', '2026-04-25', 'Confidentiality', '§2',
        'Each party agrees to maintain the confidentiality of the other party’s Confidential Information for a period of three (3) years following disclosure.'),
    ],
    clauses: [
      genericClause('cl-nda-1', 0.42, 'confidentiality', '§2',
        '785ac55a-2915-470f-b91b-859a209c3168', 'Initech Mutual NDA',
        'Each party agrees to maintain the confidentiality of the other party’s Confidential Information for a period of three (3) years following disclosure.'),
    ],
  },
  'termination rights that favour the counterparty': {
    confidence: 0.77,
    contracts: [
      contractRow('mock-term-1', 0.77, '4b34c764-0dff-49bf-b3f5-d04488ecf9c4', 'SaaS Vendor — Risky Variant',
        'Acme Inc.', '$2.4M', '2026-04-12', 'Termination for Convenience', '§12.1',
        'Vendor may terminate this Agreement at any time, for any reason, upon seven (7) days written notice. Buyer shall have no equivalent right.'),
      contractRow('mock-term-2', 0.69, '90d3eee3-2319-4439-82d5-19925820a22e', 'Globex MSA',
        'Globex Corp.', '$1.1M', '2026-03-14', 'Termination for Convenience', '§13.4',
        'Either party may terminate this Agreement with sixty (60) days written notice, except that termination by Customer requires payment of all remaining contract value.'),
    ],
    clauses: [
      genericClause('cl-term-1', 0.77, 'termination', '§12.1',
        '4b34c764-0dff-49bf-b3f5-d04488ecf9c4', 'SaaS Vendor — Risky Variant',
        'Vendor may terminate this Agreement at any time, for any reason, upon seven (7) days written notice. Buyer shall have no equivalent right.'),
      genericClause('cl-term-2', 0.69, 'termination', '§13.4',
        '90d3eee3-2319-4439-82d5-19925820a22e', 'Globex MSA',
        'Termination by Customer requires payment of all remaining contract value, including any optional renewal terms not yet exercised.'),
    ],
  },
};

/**
 * Mock implementation — drop-in replaceable with httpService.get when
 * the real `/api/v1/search` endpoint ships. The components don't know
 * the difference.
 */
export const semanticSearchService = {
  async search(
    query: string,
    options: SemanticSearchOptions = {},
  ): Promise<SemanticSearchResponse> {
    const { contractLimit = 3, clauseLimit = 5 } = options;
    const normalised = query.trim().toLowerCase();

    // Simulate network latency so the UI's loading + debounce flows
    // actually exercise their states.
    await new Promise((r) => setTimeout(r, 350));

    if (normalised.length < 3) {
      return { query, confidence: 0, contracts: [], clauses: [], total: 0 };
    }

    const canned = CANNED[normalised];
    if (canned) {
      const contracts = canned.contracts.slice(0, contractLimit);
      const clauses = canned.clauses.slice(0, clauseLimit);
      return {
        query,
        confidence: canned.confidence,
        contracts,
        clauses,
        total: canned.contracts.length + canned.clauses.length,
      };
    }

    // Off-script fallback — single, intentionally low-confidence result.
    const fallback = buildFallback(query, contractLimit, clauseLimit);
    return fallback;
  },
};

// ── Helpers ────────────────────────────────────────────────────────

function lolClause(
  id: string,
  score: number,
  docId: string,
  docName: string,
  text: string,
): ClauseSearchResult {
  return {
    id,
    score,
    label: 'Limitation of Liability',
    section: '§9.2',
    text,
    contract: { id: docId, name: docName, signedAt: '2026-03-14T00:00:00.000Z' },
  };
}

function genericClause(
  id: string,
  score: number,
  label: string,
  section: string,
  docId: string,
  docName: string,
  text: string,
): ClauseSearchResult {
  return {
    id,
    score,
    label: humanise(label),
    section,
    text,
    contract: { id: docId, name: docName, signedAt: '2026-03-14T00:00:00.000Z' },
  };
}

function contractRow(
  id: string,
  score: number,
  docId: string,
  docName: string,
  counterparty: string,
  dealSize: string,
  signedAt: string,
  matchedLabel: string,
  section: string,
  text: string,
): ContractSearchResult {
  return {
    id,
    score,
    contract: {
      id: docId,
      name: docName,
      type: 'MSA',
      counterparty,
      signedAt: `${signedAt}T00:00:00.000Z`,
      dealSize,
    },
    matchedOn: { label: matchedLabel, section, text },
  };
}

function humanise(snake: string): string {
  return snake
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function buildFallback(
  query: string,
  contractLimit: number,
  clauseLimit: number,
): SemanticSearchResponse {
  // Pick one generic contract + one generic clause from the LoL set
  // so off-script queries still demo *something* — but flagged with a
  // low confidence so the UI shows the "no strong match" banner.
  const seed = CANNED['contracts with unlimited liability']!;
  return {
    query,
    confidence: 0.34,
    contracts: seed.contracts.slice(0, Math.min(1, contractLimit)),
    clauses: seed.clauses.slice(0, Math.min(1, clauseLimit)),
    total: 2,
  };
}
