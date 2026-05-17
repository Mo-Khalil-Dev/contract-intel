import type Anthropic from '@anthropic-ai/sdk';
import {
  ExtractedClause,
  ExtractedContract,
  ExtractedMetadata,
} from '../../application/ports/clause-extractor.port';
import { ExtractionPermanentError } from '../../application/errors/clause-extraction-errors';
import {
  CLAUSE_TYPE_VALUES,
  EXTRACT_CLAUSES_TOOL,
  RISK_LEVEL_VALUES,
} from './claude-prompt';

/**
 * Pure mapping from Claude's Messages-API response → ExtractedClause[].
 *
 * Kept side-effect-free and SDK-shape-agnostic so it can be unit-tested
 * without spinning up the adapter or mocking the SDK. The driver injects
 * the raw `.content` array; this function picks out the right tool_use
 * block, validates each item against the schema, and returns the array.
 *
 * Validation here is defence-in-depth — the tool's input_schema already
 * constrains Claude's output. We re-check enums and ranges so a buggy
 * schema, model-side hallucination, or version skew surfaces here as
 * `ExtractionPermanentError('corrupt_response', ...)` rather than as a
 * cryptic domain-VO throw further down.
 */
export function mapClaudeResponseToClauses(
  content: Anthropic.Messages.ContentBlock[],
): ExtractedContract {
  const toolUse = content.find(
    (b): b is Anthropic.Messages.ToolUseBlock =>
      b.type === 'tool_use' && b.name === EXTRACT_CLAUSES_TOOL.name,
  );
  if (!toolUse) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Claude response did not include a '${EXTRACT_CLAUSES_TOOL.name}' tool_use block`,
    );
  }

  const input = toolUse.input;
  if (
    !input ||
    typeof input !== 'object' ||
    !('clauses' in input) ||
    !Array.isArray((input as { clauses: unknown }).clauses)
  ) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Claude tool_use input is missing a 'clauses' array`,
    );
  }

  const rawClauses = (input as { clauses: unknown[] }).clauses;
  const clauses = rawClauses.map((c, idx) => coerceClause(c, idx));
  const metadata = coerceMetadata(
    (input as { metadata?: unknown }).metadata,
  );
  return { clauses, metadata };
}

function coerceMetadata(raw: unknown): ExtractedMetadata {
  // Tolerate Claude omitting the metadata key entirely — degrade to an
  // empty-shaped object rather than fail the whole run.
  if (raw == null) return emptyMetadata();
  if (typeof raw !== 'object') {
    throw new ExtractionPermanentError(
      'corrupt_response',
      'metadata must be an object',
    );
  }
  const r = raw as Record<string, unknown>;

  const stringOrNull = (key: string): string | null => {
    const v = r[key];
    if (v === null || v === undefined) return null;
    if (typeof v !== 'string') {
      throw new ExtractionPermanentError(
        'corrupt_response',
        `metadata.${key} must be string or null (got ${typeof v})`,
      );
    }
    return v;
  };

  const parties: ExtractedMetadata['parties'] = [];
  if (r.parties !== undefined && r.parties !== null) {
    if (!Array.isArray(r.parties)) {
      throw new ExtractionPermanentError(
        'corrupt_response',
        'metadata.parties must be an array',
      );
    }
    for (const [i, p] of r.parties.entries()) {
      if (!p || typeof p !== 'object') {
        throw new ExtractionPermanentError(
          'corrupt_response',
          `metadata.parties[${i}] must be an object`,
        );
      }
      const obj = p as Record<string, unknown>;
      if (typeof obj.role !== 'string' || typeof obj.name !== 'string') {
        throw new ExtractionPermanentError(
          'corrupt_response',
          `metadata.parties[${i}] must have string 'role' and 'name'`,
        );
      }
      parties.push({ role: obj.role, name: obj.name });
    }
  }

  return {
    contractType: stringOrNull('contractType'),
    parties,
    effectiveDate: stringOrNull('effectiveDate'),
    terminationDate: stringOrNull('terminationDate'),
    noticePeriod: stringOrNull('noticePeriod'),
    autoRenewal: stringOrNull('autoRenewal'),
    paymentAmount: stringOrNull('paymentAmount'),
    currency: stringOrNull('currency'),
    paymentSchedule: stringOrNull('paymentSchedule'),
    priceEscalation: stringOrNull('priceEscalation'),
    paymentTerms: stringOrNull('paymentTerms'),
  };
}

function emptyMetadata(): ExtractedMetadata {
  return {
    contractType: null,
    parties: [],
    effectiveDate: null,
    terminationDate: null,
    noticePeriod: null,
    autoRenewal: null,
    paymentAmount: null,
    currency: null,
    paymentSchedule: null,
    priceEscalation: null,
    paymentTerms: null,
  };
}

function coerceClause(raw: unknown, idx: number): ExtractedClause {
  if (!raw || typeof raw !== 'object') {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} is not an object`,
    );
  }
  const r = raw as Record<string, unknown>;

  requireString(r, 'clientRef', idx);
  if (
    r.parentClientRef !== null &&
    r.parentClientRef !== undefined &&
    typeof r.parentClientRef !== 'string'
  ) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} 'parentClientRef' must be string or null`,
    );
  }
  requireEnum(r, 'type', CLAUSE_TYPE_VALUES, idx);
  requireFiniteNumber(r, 'confidence', 0, 1, idx);
  requireString(r, 'text', idx);
  requireInteger(r, 'riskScore', 0, 100, idx);
  requireEnum(r, 'riskLevel', RISK_LEVEL_VALUES, idx);
  requireStringArray(r, 'riskFlags', idx);
  requireString(r, 'riskExplanation', idx);

  return {
    clientRef: r.clientRef as string,
    parentClientRef: (r.parentClientRef) ?? null,
    type: r.type as string,
    confidence: r.confidence as number,
    text: r.text as string,
    riskScore: r.riskScore as number,
    riskLevel: r.riskLevel as ExtractedClause['riskLevel'],
    riskFlags: r.riskFlags as string[],
    riskExplanation: r.riskExplanation as string,
  };
}

// ── tiny validators ────────────────────────────────────────────────────

function requireString(r: Record<string, unknown>, key: string, idx: number): void {
  if (typeof r[key] !== 'string') {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} '${key}' must be a string`,
    );
  }
}

function requireFiniteNumber(
  r: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  idx: number,
): void {
  const v = r[key];
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} '${key}' must be a finite number in [${min}, ${max}] (got ${String(v)})`,
    );
  }
}

function requireInteger(
  r: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  idx: number,
): void {
  const v = r[key];
  if (!Number.isInteger(v) || (v as number) < min || (v as number) > max) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} '${key}' must be an integer in [${min}, ${max}] (got ${String(v)})`,
    );
  }
}

function requireEnum(
  r: Record<string, unknown>,
  key: string,
  allowed: string[],
  idx: number,
): void {
  if (typeof r[key] !== 'string' || !allowed.includes(r[key])) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} '${key}' must be one of ${allowed.join(', ')} (got '${String(r[key])}')`,
    );
  }
}

function requireStringArray(r: Record<string, unknown>, key: string, idx: number): void {
  const v = r[key];
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
    throw new ExtractionPermanentError(
      'corrupt_response',
      `Clause #${idx} '${key}' must be a string[]`,
    );
  }
}
