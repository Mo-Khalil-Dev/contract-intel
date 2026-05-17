import { BaseEntity } from '../../../../shared/domain/base-entity';
import { DomainException } from '../../../../shared/exceptions/app-error';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ClauseId } from '../value-objects/clause-id.vo';
import { ClauseType } from '../value-objects/clause-type.vo';
import { ExtractionRunId } from '../value-objects/extraction-run-id.vo';
import { ModelVersion } from '../value-objects/model-version.vo';
import { RiskLevel } from '../value-objects/risk-level.vo';
import { TextPosition } from '../value-objects/text-position.vo';

export const MAX_CLAUSE_TEXT_LENGTH = 32_000;
export const EMBEDDING_DIM = 1024;

export interface ClauseRiskFields {
  score: number;
  level: RiskLevel;
  flags: string[];
  explanation: string;
}

interface ClauseProps {
  extractionRunId: ExtractionRunId;
  documentId: DocumentId;
  parentClauseId: ClauseId | null;
  type: ClauseType;
  confidence: ConfidenceScore;
  position: TextPosition;
  text: string;
  embedding: number[] | null;
  embeddingModelVersion: ModelVersion | null;
  risk: ClauseRiskFields | null;
  createdAt: Date;
}

export class Clause extends BaseEntity<ClauseId> {
  private props: ClauseProps;

  private constructor(id: ClauseId, props: ClauseProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    id?: ClauseId;
    extractionRunId: ExtractionRunId;
    documentId: DocumentId;
    parentClauseId?: ClauseId | null;
    type: ClauseType;
    confidence: ConfidenceScore;
    position: TextPosition;
    text: string;
    risk?: ClauseRiskFields | null;
    now?: Date;
  }): Clause {
    if (params.text.length === 0) {
      throw new DomainException('INVALID_CLAUSE_TEXT', 'Clause text cannot be empty');
    }
    if (params.text.length > MAX_CLAUSE_TEXT_LENGTH) {
      throw new DomainException(
        'INVALID_CLAUSE_TEXT',
        `Clause text exceeds ${MAX_CLAUSE_TEXT_LENGTH} chars (got ${params.text.length})`,
      );
    }

    return new Clause(params.id ?? ClauseId.create(), {
      extractionRunId: params.extractionRunId,
      documentId: params.documentId,
      parentClauseId: params.parentClauseId ?? null,
      type: params.type,
      confidence: params.confidence,
      position: params.position,
      text: params.text,
      embedding: null,
      embeddingModelVersion: null,
      risk: params.risk ?? null,
      createdAt: params.now ?? new Date(),
    });
  }

  static rehydrate(id: ClauseId, props: ClauseProps): Clause {
    return new Clause(id, props);
  }

  // ── Behaviour ────────────────────────────────────────────────────

  attachEmbedding(vector: number[], modelVersion: ModelVersion): void {
    if (vector.length !== EMBEDDING_DIM) {
      throw new DomainException(
        'INVALID_EMBEDDING_DIM',
        `Embedding must have ${EMBEDDING_DIM} dimensions (got ${vector.length})`,
      );
    }
    if (vector.some((n) => !Number.isFinite(n))) {
      throw new DomainException(
        'INVALID_EMBEDDING_VALUE',
        'Embedding contains non-finite values',
      );
    }
    this.props.embedding = vector;
    this.props.embeddingModelVersion = modelVersion;
  }

  // Children must belong to the same ExtractionRun as the parent — a child
  // cannot reference a parent from a prior, superseded run.
  linkParent(parent: Clause): void {
    if (!parent.extractionRunId.equals(this.props.extractionRunId)) {
      throw new DomainException(
        'CROSS_RUN_PARENT_LINK',
        'Parent clause must belong to the same ExtractionRun',
      );
    }
    if (parent.id.equals(this.id)) {
      throw new DomainException('SELF_PARENT_LINK', 'Clause cannot be its own parent');
    }
    this.props.parentClauseId = parent.id;
  }

  // ── Read accessors ───────────────────────────────────────────────

  get extractionRunId(): ExtractionRunId {
    return this.props.extractionRunId;
  }
  get documentId(): DocumentId {
    return this.props.documentId;
  }
  get parentClauseId(): ClauseId | null {
    return this.props.parentClauseId;
  }
  get type(): ClauseType {
    return this.props.type;
  }
  get confidence(): ConfidenceScore {
    return this.props.confidence;
  }
  get position(): TextPosition {
    return this.props.position;
  }
  get text(): string {
    return this.props.text;
  }
  get embedding(): number[] | null {
    return this.props.embedding;
  }
  get embeddingModelVersion(): ModelVersion | null {
    return this.props.embeddingModelVersion;
  }
  get risk(): ClauseRiskFields | null {
    return this.props.risk;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
