export const CLAUSE_EXTRACTOR = Symbol('CLAUSE_EXTRACTOR');

/**
 * Outbound port to whichever model extracts + classifies clauses (and,
 * in the Phase 8 combined call, scores risk + extracts document-level
 * metadata inline). Mock for tests, Claude for production — same swap
 * pattern as `IOcrService`.
 *
 * Drivers must throw `ExtractionTransientError` or `ExtractionPermanentError`
 * (see `application/errors/clause-extraction-errors.ts`); the handler's
 * retry loop relies on that taxonomy.
 *
 * Offsets are NOT computed by the driver — drivers return `text` verbatim
 * and the handler resolves `[startOffset, endOffset]` by string-matching
 * each clause's text back into the input. Drivers that hallucinate text
 * are detected at the handler boundary and dropped (counted).
 */
export interface IClauseExtractor {
  extract(input: ExtractInput): Promise<ExtractedContract>;
  /** Stable identifier for the model + version. Surfaces on every
   *  ExtractionRun row so we can query mixed-version sets. */
  getModelVersion(): string;
}

/**
 * The combined output of one extraction call: per-clause artifacts plus
 * document-level metadata captured in the same pass.
 */
export interface ExtractedContract {
  clauses: ExtractedClause[];
  metadata: ExtractedMetadata;
}

/**
 * Document-level metadata. Mirrors ContractMetadata VO; the handler
 * promotes this into the VO after validation. All fields optional —
 * Claude returns null for anything the document doesn't say.
 */
export interface ExtractedMetadata {
  contractType: string | null;
  parties: { role: string; name: string }[];
  effectiveDate: string | null;
  terminationDate: string | null;
  noticePeriod: string | null;
  autoRenewal: string | null;
  paymentAmount: string | null;
  currency: string | null;
  paymentSchedule: string | null;
  priceEscalation: string | null;
  paymentTerms: string | null;
}

export interface ExtractInput {
  documentId: string;
  /** Full text from DocumentText.text. The driver may chunk internally. */
  text: string;
  /** Per-page offsets from DocumentText — drivers use these to chunk on
   *  page boundaries when the input exceeds their context window. */
  pages: { pageNumber: number; startOffset: number; endOffset: number }[];
  /** ISO 639-1 language code. Drivers may reject unsupported codes. */
  language: string;
}

export interface ExtractedClause {
  /** Driver-local temp id used to express parent-child links. Resolved
   *  to real ClauseId in the handler's two-pass insert. */
  clientRef: string;
  parentClientRef: string | null;
  /** One of the 15 ClauseTypeValue enum entries (string form). */
  type: string;
  confidence: number;
  /** Verbatim slice expected to be findable in input.text. */
  text: string;
  /** Phase 8 persists these; the UI ignores them until Phase 9. */
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFlags: string[];
  riskExplanation: string;
}
