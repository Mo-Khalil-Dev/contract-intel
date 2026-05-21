/**
 * Find the most semantically similar clauses to a given source clause,
 * across the rest of the portfolio.
 *
 * See US-CI-1 (Requirement 14) for behavioural acceptance criteria and
 * docs/design/similar-clauses-visual.md for the UX this query backs.
 *
 * Validation of `limit` lives in the handler (not in the query class)
 * so the error-code path is consistent with the HTTP boundary's
 * mapping table.
 */
export class GetSimilarClausesQuery {
  constructor(
    readonly clauseId: string,
    readonly limit: number = 5,
  ) {}
}
