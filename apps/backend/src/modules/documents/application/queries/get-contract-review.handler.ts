import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CONTRACT_REVIEW_STORE,
  IContractReviewStore,
} from '../../domain/ports/contract-review-store.port';
import {
  GetContractReviewQuery,
  GetContractReviewResult,
} from './get-contract-review.query';

@QueryHandler(GetContractReviewQuery)
export class GetContractReviewHandler
  implements IQueryHandler<GetContractReviewQuery, GetContractReviewResult>
{
  constructor(
    @Inject(CONTRACT_REVIEW_STORE)
    private readonly store: IContractReviewStore,
  ) {}

  async execute(
    query: GetContractReviewQuery,
  ): Promise<GetContractReviewResult> {
    const review = await this.store.get(query.documentId, query.orgId);
    if (!review) {
      throw new NotFoundException(`Document ${query.documentId} not found`);
    }
    return {
      documentId: review.documentId,
      status: review.status,
      markdown: review.markdown,
      runtime: review.runtime,
      error: review.error,
      reviewedAt: review.reviewedAt ? review.reviewedAt.toISOString() : null,
    };
  }
}
