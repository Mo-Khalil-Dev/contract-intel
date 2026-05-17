import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { DomainException } from '../../../../shared/exceptions/app-error';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import {
  ClauseExtractionCompletedEvent,
  ClauseExtractionFailedEvent,
  ClauseExtractionStartedEvent,
  ClausesExtractedEvent,
} from '../events/clause.events';
import { ContractMetadata } from '../value-objects/contract-metadata.vo';
import { ExtractionRunId } from '../value-objects/extraction-run-id.vo';
import {
  ExtractionStatus,
  ExtractionStatusValue,
} from '../value-objects/extraction-status.vo';
import { ModelVersion } from '../value-objects/model-version.vo';

interface ExtractionRunProps {
  documentId: DocumentId;
  classifierModelVersion: ModelVersion;
  embeddingModelVersion: ModelVersion;
  status: ExtractionStatus;
  startedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
  clauseCount: number;
  droppedClauseCount: number;
  // Document-level metadata captured by the same Claude call that
  // produces clauses. Null until the run completes; persisted as a
  // snapshot so re-extraction never mutates a prior run's metadata.
  metadata: ContractMetadata | null;
}

export class ExtractionRun extends AggregateRoot<ExtractionRunId> {
  private props: ExtractionRunProps;

  private constructor(id: ExtractionRunId, props: ExtractionRunProps) {
    super(id);
    this.props = props;
  }

  static start(params: {
    id?: ExtractionRunId;
    documentId: DocumentId;
    classifierModelVersion: ModelVersion;
    embeddingModelVersion: ModelVersion;
    now?: Date;
  }): ExtractionRun {
    const id = params.id ?? ExtractionRunId.create();
    const now = params.now ?? new Date();
    const run = new ExtractionRun(id, {
      documentId: params.documentId,
      classifierModelVersion: params.classifierModelVersion,
      embeddingModelVersion: params.embeddingModelVersion,
      status: ExtractionStatus.running(),
      startedAt: now,
      completedAt: null,
      failureReason: null,
      clauseCount: 0,
      droppedClauseCount: 0,
      metadata: null,
    });

    run.addDomainEvent(
      new ClauseExtractionStartedEvent(
        run.id.value,
        run.props.documentId.value,
        run.props.classifierModelVersion.value,
        run.props.embeddingModelVersion.value,
        now,
      ),
    );
    return run;
  }

  static rehydrate(id: ExtractionRunId, props: ExtractionRunProps): ExtractionRun {
    return new ExtractionRun(id, props);
  }

  complete(params: {
    clauseCount: number;
    droppedClauseCount: number;
    metadata?: ContractMetadata | null;
    now?: Date;
  }): void {
    if (!Number.isInteger(params.clauseCount) || params.clauseCount < 0) {
      throw new DomainException(
        'INVALID_CLAUSE_COUNT',
        `clauseCount must be a non-negative integer (got ${params.clauseCount})`,
      );
    }
    if (
      !Number.isInteger(params.droppedClauseCount) ||
      params.droppedClauseCount < 0
    ) {
      throw new DomainException(
        'INVALID_DROPPED_COUNT',
        `droppedClauseCount must be a non-negative integer (got ${params.droppedClauseCount})`,
      );
    }
    const at = params.now ?? new Date();
    this.props.status = this.props.status.transitionTo(
      ExtractionStatus.fromValue('complete'),
    );
    this.props.clauseCount = params.clauseCount;
    this.props.droppedClauseCount = params.droppedClauseCount;
    this.props.metadata = params.metadata ?? null;
    this.props.completedAt = at;

    this.addDomainEvent(
      new ClausesExtractedEvent(
        this.id.value,
        this.props.documentId.value,
        params.clauseCount,
        params.droppedClauseCount,
      ),
    );
    this.addDomainEvent(
      new ClauseExtractionCompletedEvent(
        this.id.value,
        this.props.documentId.value,
        params.clauseCount,
        at,
      ),
    );
  }

  fail(reason: string, now?: Date): void {
    if (!reason || reason.trim().length === 0) {
      throw new DomainException(
        'INVALID_FAILURE_REASON',
        'Failure reason must be a non-empty string',
      );
    }
    const at = now ?? new Date();
    this.props.status = this.props.status.transitionTo(
      ExtractionStatus.fromValue('failed'),
    );
    this.props.failureReason = reason;
    this.props.completedAt = at;

    this.addDomainEvent(
      new ClauseExtractionFailedEvent(
        this.id.value,
        this.props.documentId.value,
        reason,
        at,
      ),
    );
  }

  isRunning(): boolean {
    return this.props.status.value === ExtractionStatusValue.RUNNING;
  }
  isComplete(): boolean {
    return this.props.status.value === ExtractionStatusValue.COMPLETE;
  }
  isFailed(): boolean {
    return this.props.status.value === ExtractionStatusValue.FAILED;
  }

  get documentId(): DocumentId {
    return this.props.documentId;
  }
  get classifierModelVersion(): ModelVersion {
    return this.props.classifierModelVersion;
  }
  get embeddingModelVersion(): ModelVersion {
    return this.props.embeddingModelVersion;
  }
  get status(): ExtractionStatus {
    return this.props.status;
  }
  get startedAt(): Date {
    return this.props.startedAt;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get failureReason(): string | null {
    return this.props.failureReason;
  }
  get clauseCount(): number {
    return this.props.clauseCount;
  }
  get droppedClauseCount(): number {
    return this.props.droppedClauseCount;
  }
  get metadata(): ContractMetadata | null {
    return this.props.metadata;
  }
}
