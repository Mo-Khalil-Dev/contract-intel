import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ExtractionRunStatusDto,
  GetExtractionRunStatusQuery,
} from './get-extraction-run-status.query';
import {
  EXTRACTION_RUN_REPOSITORY,
  IExtractionRunRepository,
} from '../../domain/extraction-run.repository';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';

@QueryHandler(GetExtractionRunStatusQuery)
export class GetExtractionRunStatusHandler
  implements IQueryHandler<GetExtractionRunStatusQuery, ExtractionRunStatusDto>
{
  constructor(
    @Inject(EXTRACTION_RUN_REPOSITORY)
    private readonly runs: IExtractionRunRepository,
  ) {}

  async execute(
    query: GetExtractionRunStatusQuery,
  ): Promise<ExtractionRunStatusDto> {
    const docId = DocumentId.fromString(query.documentId);
    const run = await this.runs.findCurrentForDocument(docId);
    if (!run) {
      return {
        runId: null,
        status: 'not_started',
        clauseCount: 0,
        droppedClauseCount: 0,
        failureReason: null,
        startedAt: null,
        completedAt: null,
        metadata: null,
      };
    }
    return {
      runId: run.id.value,
      status: run.status.value,
      clauseCount: run.clauseCount,
      droppedClauseCount: run.droppedClauseCount,
      failureReason: run.failureReason,
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
      metadata: run.metadata
        ? {
            contractType: run.metadata.contractType,
            parties: run.metadata.parties,
            effectiveDate: run.metadata.effectiveDate,
            terminationDate: run.metadata.terminationDate,
            noticePeriod: run.metadata.noticePeriod,
            autoRenewal: run.metadata.autoRenewal,
            paymentAmount: run.metadata.paymentAmount,
            currency: run.metadata.currency,
            paymentSchedule: run.metadata.paymentSchedule,
            priceEscalation: run.metadata.priceEscalation,
            paymentTerms: run.metadata.paymentTerms,
          }
        : null,
    };
  }
}
