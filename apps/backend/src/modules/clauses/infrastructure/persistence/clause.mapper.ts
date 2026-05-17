import { Clause } from '../../domain/entities/clause';
import { ClauseId } from '../../domain/value-objects/clause-id.vo';
import { ClauseType } from '../../domain/value-objects/clause-type.vo';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { ModelVersion } from '../../domain/value-objects/model-version.vo';
import { RiskLevel } from '../../domain/value-objects/risk-level.vo';
import { TextPosition } from '../../domain/value-objects/text-position.vo';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';

/**
 * Shape we read back from `$queryRaw`. The `embedding` column is selected
 * as text (`embedding::text`) so we get the literal `'[a,b,...]'` form;
 * `null` when the embedding step hasn't run or failed.
 */
export interface ClauseRawRow {
  id: string;
  extractionRunId: string;
  documentId: string;
  parentClauseId: string | null;
  type: string;
  confidence: number;
  pageNumber: number;
  startOffset: number;
  endOffset: number;
  text: string;
  embedding: string | null;
  embeddingModelVersion: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  riskFlags: string[];
  riskExplanation: string | null;
  createdAt: Date;
}

export class ClauseMapper {
  static toDomain(row: ClauseRawRow): Clause {
    const clause = Clause.rehydrate(ClauseId.fromString(row.id), {
      extractionRunId: ExtractionRunId.fromString(row.extractionRunId),
      documentId: DocumentId.fromString(row.documentId),
      parentClauseId: row.parentClauseId
        ? ClauseId.fromString(row.parentClauseId)
        : null,
      type: ClauseType.fromValue(row.type),
      confidence: ConfidenceScore.fromNumber(row.confidence),
      position: TextPosition.create({
        startOffset: row.startOffset,
        endOffset: row.endOffset,
        pageNumber: row.pageNumber,
      }),
      text: row.text,
      embedding: row.embedding ? parsePgVector(row.embedding) : null,
      embeddingModelVersion: row.embeddingModelVersion
        ? ModelVersion.parse(row.embeddingModelVersion)
        : null,
      risk:
        row.riskScore !== null && row.riskLevel !== null
          ? {
              score: row.riskScore,
              level: RiskLevel.fromValue(row.riskLevel),
              flags: row.riskFlags,
              explanation: row.riskExplanation ?? '',
            }
          : null,
      createdAt: row.createdAt,
    });
    return clause;
  }

  /**
   * Encode a JS number[] as pgvector's text input format: '[1,2,3]'.
   * Used in INSERT INTO ... VALUES (..., $1::vector).
   */
  static encodeVector(vector: number[]): string {
    return `[${vector.join(',')}]`;
  }
}

/** Parse pgvector's text output (e.g. '[0.1,-0.2,0.3]') into number[]. */
function parsePgVector(literal: string): number[] {
  // Strip enclosing brackets, split on commas. pgvector always emits
  // ASCII digits / signs / dots; no locale parsing needed.
  if (!literal.startsWith('[') || !literal.endsWith(']')) {
    throw new Error(`Malformed pgvector literal: ${literal.slice(0, 40)}`);
  }
  const body = literal.slice(1, -1);
  if (body.length === 0) return [];
  return body.split(',').map((s) => Number(s));
}
