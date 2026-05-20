export class GetDocumentSummaryQuery {
  constructor(readonly orgId: string) {}
}

export interface GetDocumentSummaryResult {
  totalContracts: number;
  analysed: number;
  avgRisk: number;
  criticalFlags: number;
  unlimitedLiability: number;
}
