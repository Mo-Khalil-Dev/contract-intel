/**
 * Wire types for "Ask Your Portfolio" (Phase 12, Requirement 15).
 * Mirrors the backend AskResponseDto / answer-format shapes exactly.
 */

export type QueryType =
  | 'risk-analysis'
  | 'comparison'
  | 'timeline'
  | 'clause-type-search'
  | 'financial'
  | 'document-specific'
  | 'general';

export type AnswerFormat =
  | 'prose'
  | 'ranked-list'
  | 'comparison-table'
  | 'timeline'
  | 'clause-list'
  | 'financial-summary'
  | 'doc-summary';

export interface Citation {
  index: number;
  ref: string;
  documentId: string;
  title: string;
}

export interface RankedRow {
  documentId: string;
  title: string;
  type: string;
  counterparty: string;
  riskScore: number | null;
  riskBand: 'high' | 'medium' | 'low' | 'unknown';
  flagsRed: number;
  hasUnlimitedLiability: boolean;
}

export interface RankedListData {
  rows: RankedRow[];
}

export type StructuredData = RankedListData | Record<string, unknown> | null;

export interface AskRequest {
  question: string;
  threadId?: string;
}

export interface AskResponse {
  threadId: string;
  messageId: string;
  queryType: QueryType;
  format: AnswerFormat;
  prose: string;
  structuredData: StructuredData;
  citations: Citation[];
}
