export class GetExtractionRunStatusQuery {
  constructor(readonly documentId: string) {}
}

/** Snapshot of contract-level metadata extracted by Claude. All fields
 *  optional — Claude returns null for anything the document didn't say. */
export interface ContractMetadataDto {
  contractType: string | null;
  parties: { role: string; name: string }[];
  effectiveDate: string | null;
  terminationDate: string | null;
  noticePeriod: string | null;
  autoRenewal: string | null;
  paymentAmount: string | null;
  currency: string | null;
  paymentSchedule: string | null;
  priceEscalation: string | null;
  paymentTerms: string | null;
}

export interface ExtractionRunStatusDto {
  runId: string | null;
  status: 'not_started' | 'running' | 'complete' | 'failed';
  clauseCount: number;
  droppedClauseCount: number;
  failureReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
  metadata: ContractMetadataDto | null;
}
