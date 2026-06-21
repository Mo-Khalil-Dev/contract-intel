/**
 * Static prompt + tool schema for the Claude clause-extraction call.
 *
 * Kept in its own file so:
 *   - The driver stays focused on transport + error mapping.
 *   - Prompt caching (cache_control: ephemeral) hashes a stable string.
 *     A change to instructions / rubric / examples is the only thing that
 *     should invalidate the prefix cache.
 *   - We can iterate on prompt copy without touching the adapter or tests
 *     that exercise transport behaviour.
 *
 * Risk rubric is DRAFT — see clause-extraction-design.md §6.2.
 * Phase 9 prerequisite: SME validation against ground-truth clauses
 * before the Phase 9 UI surfaces risk scores to users.
 */

import { ClauseTypeValue } from '../../domain/value-objects/clause-type.vo';
import { RiskLevelValue } from '../../domain/value-objects/risk-level.vo';

export const CLAUSE_TYPE_VALUES = Object.values(ClauseTypeValue) as string[];
export const RISK_LEVEL_VALUES = Object.values(RiskLevelValue) as string[];

export const CLAUDE_SYSTEM_PROMPT = `You are a senior contracts attorney analysing commercial agreements. For
every contract, return TWO artefacts via the extract_clauses tool:

  (A) Document-level metadata — parties, key dates, financial terms.
      Required for the reviewer's at-a-glance summary.

  (B) An exhaustive list of clauses (including nested sub-clauses), each
      classified by type and scored for risk.

METADATA rules:
- "contractType": short label like "Vendor", "Client", "Service",
  "NDA", "SaaS", "Employment". Null if undeterminable.
- "parties": each entry has "role" (Provider | Client | Vendor | Buyer
  | Licensor | Licensee | etc., as the document names them) and "name"
  (legal name verbatim). Empty array if undeterminable.
- All other metadata fields: copy the text VERBATIM from the document
  (e.g. "£50,000", "Net 30 days", "thirty (30) days' written notice").
  Do not paraphrase, do not parse into structured types — the reviewer
  wants the document's own words. Use null when the document is silent.

CLAUSE rules:
- Pick exactly one type from the 15-value taxonomy. If a clause genuinely
  doesn't fit any specific type, use "other" with low confidence rather
  than forcing a match.
- The "text" field MUST be a verbatim slice of the input — character for
  character, no paraphrasing, no whitespace normalisation, no ellipses.
  The server resolves offsets by string-matching your output back into
  the input; clauses whose text isn't found verbatim are dropped.
- Assign each clause a temporary "clientRef" ("c1", "c2", …). For a
  sub-clause, set its "parentClientRef" to the parent's clientRef.
  Maximum nesting depth = 2.
- Always populate risk fields (Phase 8 persists them; Phase 9 surfaces
  them in the UI). Rubric below.

Risk rubric (DRAFT — Phase 9 will refine with legal-SME validation):

  RISK FACTORS to weigh:                      
    - Unbounded liability (no cap on damages)
    - One-sided obligations (only one party bears the burden)
    - Broad indemnification scope (third-party IP, gross negligence carve-outs)
    - Short notice periods (<30 days for termination)
    - Auto-renewal without opt-out
    - Governing law in unfavorable jurisdiction
    - Vague or undefined key terms
    - Waiver of important rights (jury trial, class action)
    - MFN clauses
    - Aggressive non-compete scope (geography, duration)

  SCORING BANDS:
    0–25   low       Standard market terms; balanced; mutual
    26–50  medium    Minor deviation from standard; manageable
    51–75  high      Meaningful exposure; requires negotiation
    76–100 critical  Unacceptable as written; must be renegotiated

  CALIBRATION EXAMPLES:
    "Liability is capped at fees paid in the prior 12 months."
      → riskScore 20, riskLevel low, riskFlags [],
        "Standard mutual cap on damages."

    "Either party may terminate for material breach with 30 days' cure."
      → riskScore 30, riskLevel medium, riskFlags [],
        "Standard cure-and-terminate language."

    "Vendor's liability shall be unlimited for any breach of this Agreement."
      → riskScore 85, riskLevel critical, riskFlags ["uncapped_liability"],
        "No cap on damages exposes the company to unbounded loss."

Return via the extract_clauses tool. Do not produce prose outside the tool call.`;

export const EXTRACT_CLAUSES_TOOL = {
  name: 'extract_clauses',
  description:
    'Submit the extracted document metadata, classified clauses, and risk scores.',
  input_schema: {
    type: 'object',
    properties: {
      metadata: {
        type: 'object',
        required: [
          'contractType',
          'parties',
          'effectiveDate',
          'terminationDate',
          'noticePeriod',
          'autoRenewal',
          'paymentAmount',
          'currency',
          'paymentSchedule',
          'priceEscalation',
          'paymentTerms',
        ],
        properties: {
          contractType: { type: ['string', 'null'] },
          parties: {
            type: 'array',
            items: {
              type: 'object',
              required: ['role', 'name'],
              properties: {
                role: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          effectiveDate: { type: ['string', 'null'] },
          terminationDate: { type: ['string', 'null'] },
          noticePeriod: { type: ['string', 'null'] },
          autoRenewal: { type: ['string', 'null'] },
          paymentAmount: { type: ['string', 'null'] },
          currency: { type: ['string', 'null'] },
          paymentSchedule: { type: ['string', 'null'] },
          priceEscalation: { type: ['string', 'null'] },
          paymentTerms: { type: ['string', 'null'] },
        },
      },
      clauses: {
        type: 'array',
        items: {
          type: 'object',
          required: [
            'clientRef',
            'type',
            'confidence',
            'text',
            'riskScore',
            'riskLevel',
            'riskFlags',
            'riskExplanation',
          ],
          properties: {
            clientRef: { type: 'string' },
            parentClientRef: { type: ['string', 'null'] },
            type: { type: 'string', enum: CLAUSE_TYPE_VALUES },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            text: { type: 'string' },
            riskScore: { type: 'integer', minimum: 0, maximum: 100 },
            riskLevel: { type: 'string', enum: RISK_LEVEL_VALUES },
            riskFlags: { type: 'array', items: { type: 'string' } },
            riskExplanation: { type: 'string' },
          },
        },
      },
    },
    required: ['metadata', 'clauses'],
  },
} as const satisfies {
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required: string[] };
};

/** Default Claude model. Override via env (CLAUDE_MODEL). */
export const DEFAULT_CLAUDE_MODEL = 'claude-opus-4-7';

/**
 * Above this chunk size we split the input by page boundaries. Picked to
 * stay well clear of Claude's 200k-token context after factoring in the
 * system prompt, tool schema, and output budget. See design §7.
 */
export const CHUNK_THRESHOLD_CHARS = 200_000;

/**
 * Max output tokens per call.
 *
 * Dense data-protection addenda (e.g. AWS / Salesforce GDPR DPAs) pack
 * 15+ clauses with long quoted snippets into a single document. The
 * JSON-encoded tool_use input + metadata can exceed the previous 8192
 * cap, after which Anthropic returns a truncated tool_use whose input
 * has no `clauses` key — surfacing here as
 * `ExtractionPermanentError('corrupt_response')` rather than a clean
 * stop_reason: 'max_tokens'.
 *
 * Claude 4.7 Opus supports up to 32K output tokens; raising the cap is
 * the cheap fix. The extractor logs the response's `stop_reason` on
 * mapper failure so we can confirm when truncation was the cause.
 */
export const MAX_OUTPUT_TOKENS = 32_768;
