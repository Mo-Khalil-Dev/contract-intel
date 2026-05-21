-- Phase 11: Similar Clauses + Semantic Search
-- See PHASE_11_SPEC.md and US-010_Similar_Clauses.md.
--
-- Adds an HNSW index on Clause.embedding for cosine-distance kNN queries.
-- Without this index, every similar-clauses / semantic-search request would
-- perform a sequential scan over the full Clause table — fine at 10k rows,
-- unusable past 100k.
--
-- HNSW (Hierarchical Navigable Small World) is preferred over IVFFlat:
--   - no training step required (IVFFlat needs ANALYZE first)
--   - better recall at small-to-medium scale
--   - pgvector >= 0.5.0 supports it natively
--
-- The index is built CONCURRENTLY so it does not block writes on the
-- Clause table. Note: Prisma's `migrate deploy` wraps each migration in a
-- transaction by default — CREATE INDEX CONCURRENTLY cannot run inside a
-- transaction. The leading `--` directive below disables the wrapping.

-- prisma-no-transaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Clause_embedding_cosine_idx"
  ON "Clause"
  USING hnsw (embedding vector_cosine_ops);
