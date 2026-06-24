import type {
  ContractReviewStatus,
} from '../../domain/ports/contract-review-store.port';
import type { ContractReviewRuntime } from '../../domain/ports/contract-review-runner.port';

export class GetContractReviewQuery {
  constructor(
    public readonly documentId: string,
    public readonly orgId: string,
  ) {}
}

export interface GetContractReviewResult {
  documentId: string;
  status: ContractReviewStatus;
  markdown: string | null;
  runtime: ContractReviewRuntime | null;
  error: string | null;
  reviewedAt: string | null;
}
