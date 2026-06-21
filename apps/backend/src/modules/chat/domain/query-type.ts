/**
 * The seven query types a portfolio question can be classified into
 * (Phase 12 / Requirement 15). `general` is the fallback when no
 * specialised handler matches.
 *
 * Adding a type here is step one; step two is registering a matching
 * QueryHandler in the QueryHandlerRegistry. The MVP slice ships
 * `risk-analysis` end-to-end; the rest land in Task 12.9.
 */
export const QUERY_TYPES = [
  'risk-analysis',
  'comparison',
  'timeline',
  'clause-type-search',
  'financial',
  'document-specific',
  'general',
] as const;

export type QueryType = (typeof QUERY_TYPES)[number];

export const GENERAL_QUERY_TYPE: QueryType = 'general';
