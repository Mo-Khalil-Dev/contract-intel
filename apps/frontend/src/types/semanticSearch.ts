/**
 * Frontend types for Phase 11 US-CI-2 — Semantic Search.
 *
 * Mirrors the backend contract documented in
 * USER_STORIES/US-011_Semantic_Search.md §API Contract. In v1 the
 * backend isn't implemented yet — `semanticSearchService` returns
 * curated mock data conforming to this shape. When the real
 * `GET /api/v1/search` lands, swap the service body only; the
 * components/hook never see the change.
 */

import type { DocumentId } from './documents';

export interface ContractSearchResult {
  id: string;
  /** Cosine similarity of the best-matching clause in this contract. */
  score: number;
  contract: {
    id: DocumentId;
    name: string;
    type: string;
    counterparty: string;
    /** Signed / effective date in ISO format. */
    signedAt: string;
    /** Free-form display string for deal size (e.g. "$2.4M"). */
    dealSize: string;
  };
  /** Why the contract matched — the "Matched on" chip data. */
  matchedOn: {
    /** Human-readable clause label, e.g. "Limitation of Liability". */
    label: string;
    /** Section reference like "§9.2". Always renderable; placeholder when absent. */
    section: string;
    /** Snippet of the matching clause text. */
    text: string;
  };
}

export interface ClauseSearchResult {
  id: string;
  score: number;
  label: string;
  section: string;
  text: string;
  contract: {
    id: DocumentId;
    name: string;
    signedAt: string;
  };
}

export interface SemanticSearchResponse {
  query: string;
  /** Top result's score. UI shows the low-confidence banner when < 0.55. */
  confidence: number;
  contracts: ContractSearchResult[];
  clauses: ClauseSearchResult[];
  /**
   * Total result count across both buckets — drives "See all (N)"
   * links in the overlay and the "Showing N of Total" counter on
   * the dedicated page.
   */
  total: number;
}

export interface SemanticSearchOptions {
  /** Cap per result type. Default: 3 contracts + 5 clauses (overlay). */
  contractLimit?: number;
  clauseLimit?: number;
  /** Future: counterparty, dateRange — surfaced on /search filters. */
  counterparty?: string;
  /** ISO date — match contracts signed on/after. */
  signedAfter?: string;
}
