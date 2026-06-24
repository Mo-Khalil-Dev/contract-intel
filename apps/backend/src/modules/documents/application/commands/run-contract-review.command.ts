import type { ContractReviewStatus } from '../../domain/ports/contract-review-store.port';

/** Starts an asynchronous review run and returns immediately. */
export class RunContractReviewCommand {
  constructor(
    public readonly documentId: string,
    public readonly orgId: string,
  ) {}
}

export interface RunContractReviewResult {
  documentId: string;
  /** Always 'running' on a fresh start; the client then polls the query. */
  status: ContractReviewStatus;
}
