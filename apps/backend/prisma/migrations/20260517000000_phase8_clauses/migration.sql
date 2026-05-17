-- Phase 8: Clause Extraction & Classification
-- See clause-extraction-design.md §10.

-- pgvector extension for clause embeddings (1024-dim, voyage-law-2 in prod).
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Document extensions
-- ---------------------------------------------------------------------------
ALTER TABLE "Document"
  ADD COLUMN "extractionStatus"       TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN "currentExtractionRunId" TEXT;

CREATE INDEX "Document_extractionStatus_idx" ON "Document"("extractionStatus");

-- ---------------------------------------------------------------------------
-- ExtractionRun
-- ---------------------------------------------------------------------------
CREATE TABLE "ExtractionRun" (
  "id"                     TEXT      PRIMARY KEY,
  "documentId"             TEXT      NOT NULL,
  "classifierModelVersion" TEXT      NOT NULL,
  "embeddingModelVersion"  TEXT      NOT NULL,
  "status"                 TEXT      NOT NULL,
  "failureReason"          TEXT,
  "clauseCount"            INTEGER   NOT NULL DEFAULT 0,
  "droppedClauseCount"     INTEGER   NOT NULL DEFAULT 0,
  "startedAt"              TIMESTAMP NOT NULL,
  "completedAt"            TIMESTAMP,
  "createdAt"              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractionRun_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE
);

CREATE INDEX "ExtractionRun_documentId_idx" ON "ExtractionRun"("documentId");
CREATE INDEX "ExtractionRun_status_idx"      ON "ExtractionRun"("status");

-- ---------------------------------------------------------------------------
-- Clause
-- ---------------------------------------------------------------------------
CREATE TABLE "Clause" (
  "id"                    TEXT          PRIMARY KEY,
  "extractionRunId"       TEXT          NOT NULL,
  "documentId"            TEXT          NOT NULL,  -- denormalised; fast doc-scoped queries
  "parentClauseId"        TEXT,                    -- self-FK, max 2 levels, SET NULL on parent delete
  "type"                  TEXT          NOT NULL,
  "confidence"            DOUBLE PRECISION NOT NULL,
  "pageNumber"            INTEGER       NOT NULL,
  "startOffset"           INTEGER       NOT NULL,
  "endOffset"             INTEGER       NOT NULL,
  "text"                  TEXT          NOT NULL,
  "embedding"             vector(1024),            -- pgvector; nullable until embed step done
  "embeddingModelVersion" TEXT,
  "riskScore"             INTEGER,
  "riskLevel"             TEXT,
  "riskFlags"             TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  "riskExplanation"       TEXT,
  "createdAt"             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Clause_extractionRunId_fkey"
    FOREIGN KEY ("extractionRunId") REFERENCES "ExtractionRun"("id") ON DELETE CASCADE,
  CONSTRAINT "Clause_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE,
  CONSTRAINT "Clause_parentClauseId_fkey"
    FOREIGN KEY ("parentClauseId") REFERENCES "Clause"("id") ON DELETE SET NULL
);

CREATE INDEX "Clause_documentId_idx"      ON "Clause"("documentId");
CREATE INDEX "Clause_extractionRunId_idx" ON "Clause"("extractionRunId");
CREATE INDEX "Clause_type_idx"            ON "Clause"("type");
CREATE INDEX "Clause_parentClauseId_idx"  ON "Clause"("parentClauseId");

-- HNSW vector index intentionally deferred to Phase 10 — at Phase 1 scale
-- (<10k clauses) a sequential scan is well within latency budget. Adding
-- the index now would consume RAM and slow inserts without benefit.
