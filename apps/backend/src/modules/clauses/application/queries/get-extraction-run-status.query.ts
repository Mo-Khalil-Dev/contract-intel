export class GetExtractionRunStatusQuery {
  constructor(readonly documentId: string) {}
}

export interface ExtractionRunStatusDto {
  runId: string | null;
  status: 'not_started' | 'running' | 'complete' | 'failed';
  clauseCount: number;
  droppedClauseCount: number;
  failureReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
}
