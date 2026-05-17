/**
 * Frontend types for Phase 8 clause extraction. Mirrors backend DTOs:
 *   - ClauseDto                  → ClauseResponse here
 *   - ExtractionRunStatusDto     → ExtractionStatusResponse here
 *   - ContractMetadataDto        → ContractMetadata here
 *
 * Risk fields are populated by Claude during extraction but the
 * Phase 8 UI uses them in Risk Flags + Document tabs only — risk is
 * intentionally NOT surfaced on the Overview risk-snapshot card per
 * D15 (SME validation gates Phase 9).
 */

import type { DocumentId } from './documents';

export const CLAUSE_TYPES = [
  'indemnification',
  'limitation_of_liability',
  'termination',
  'governing_law',
  'dispute_resolution',
  'intellectual_property',
  'confidentiality',
  'payment_terms',
  'representations_warranties',
  'force_majeure',
  'assignment',
  'change_of_control',
  'non_compete',
  'data_protection',
  'other',
] as const;
export type ClauseType = (typeof CLAUSE_TYPES)[number];

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ClauseRisk {
  score: number; // 0..100
  level: RiskLevel;
  flags: string[];
  explanation: string;
}

export interface ClauseResponse {
  id: string;
  extractionRunId: string;
  documentId: DocumentId;
  parentClauseId: string | null;
  type: ClauseType;
  confidence: number;
  pageNumber: number;
  startOffset: number;
  endOffset: number;
  text: string;
  hasEmbedding: boolean;
  risk: ClauseRisk | null;
  createdAt: string;
}

export interface Party {
  role: string;
  name: string;
}

export interface ContractMetadata {
  contractType: string | null;
  parties: Party[];
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

export type ExtractionStatus = 'not_started' | 'running' | 'complete' | 'failed';

export interface ExtractionStatusResponse {
  runId: string | null;
  status: ExtractionStatus;
  clauseCount: number;
  droppedClauseCount: number;
  failureReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
  metadata: ContractMetadata | null;
}

/**
 * Human-readable label for a clause type. Used in chips, headings, etc.
 * Single source of truth so the frontend stays in lockstep with the
 * 15-value backend taxonomy.
 */
export const CLAUSE_TYPE_LABELS: Record<ClauseType, string> = {
  indemnification: 'Indemnification',
  limitation_of_liability: 'Limitation of Liability',
  termination: 'Termination',
  governing_law: 'Governing Law',
  dispute_resolution: 'Dispute Resolution',
  intellectual_property: 'Intellectual Property',
  confidentiality: 'Confidentiality',
  payment_terms: 'Payment Terms',
  representations_warranties: 'Representations & Warranties',
  force_majeure: 'Force Majeure',
  assignment: 'Assignment',
  change_of_control: 'Change of Control',
  non_compete: 'Non-Compete',
  data_protection: 'Data Protection',
  other: 'Other',
};
