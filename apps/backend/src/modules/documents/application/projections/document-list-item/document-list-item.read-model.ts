/**
 * Phase 10 — Document list projection (CQRS read model).
 *
 * Denormalised, per-document row optimised for the Contracts View
 * (Portfolio) screen. The `Document` aggregate remains the source of
 * truth; this projection is a disposable cache rebuilt by domain event
 * handlers under `application/projections/document-list-item/`.
 *
 * Pure type — no behaviour, no invariants. Plain shape returned by the
 * read-model repository to the query handlers.
 */

export type DocumentListItemStatus = 'complete' | 'processing' | 'failed';

export interface DocumentListItem {
  /** Primary key — same value as Document.id. */
  id: string;
  orgId: string;
  /** File name with extension stripped. */
  name: string;
  /** ContractType enum value (lowercase). */
  type: string;
  /** First counterparty, or '' if unknown. */
  counterparty: string;
  /** Document-level risk score (1 dp). Null until extraction completes. */
  riskScore: number | null;
  flagsRed: number;
  flagsOrange: number;
  flagsBlue: number;
  terminationDate: Date | null;
  status: DocumentListItemStatus;
  uploadedAt: Date;
  /** Precomputed for the "Unlimited liability" KPI. */
  hasUnlimitedLiability: boolean;
  updatedAt: Date;
}
