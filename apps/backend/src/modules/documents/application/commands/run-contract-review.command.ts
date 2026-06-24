import type { ContractReviewRuntime } from '../../domain/ports/contract-review-runner.port';

export class RunContractReviewCommand {
  constructor(
    public readonly documentId: string,
    public readonly orgId: string,
  ) {}
}

export interface RunContractReviewResult {
  documentId: string;
  markdown: string;
  runtime: ContractReviewRuntime;
  runId?: string;
}
