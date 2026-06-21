/**
 * Response formats a handler can emit (Phase 12). The frontend picks a
 * result block from `format` (Task 12.9). The MVP ships `ranked-list`
 * (risk) and `prose` (general fallback).
 */
export type AnswerFormat =
  | 'prose'
  | 'ranked-list'
  | 'comparison-table'
  | 'timeline'
  | 'clause-list'
  | 'financial-summary'
  | 'doc-summary';

/** One row of a ranked-list result (risk-analysis). */
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

/** Discriminated by the owning message's `format`; `null` for pure prose. */
export type StructuredData = RankedListData | Record<string, unknown> | null;
