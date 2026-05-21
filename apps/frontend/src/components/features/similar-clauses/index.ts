/**
 * Phase 11 — Similar Clauses (US-CI-1) component surface.
 *
 * Re-exports the components consumers will compose into the existing
 * ResultsPage (Task 11.6 wires the trigger; Tasks 11.7/11.8 are the
 * drawer and navigation behaviour respectively).
 *
 * `SimilarityBar` and `PrecedentRow` are flagged as reusable
 * infrastructure for US-CI-2 (Semantic Search) and Phases 12/13.
 */
export { FindSimilarButton } from './FindSimilarButton';
export { SimilarClausesDrawer } from './SimilarClausesDrawer';
export { SimilarityBar } from './SimilarityBar';
export { PrecedentRow } from './PrecedentRow';
export { SourceClauseCard } from './SourceClauseCard';
export { EmptyPrecedentState } from './EmptyPrecedentState';
