-- Phase 8 Task 8.4.1: Contract metadata extraction
-- See clause-extraction-design.md §3.1 (ExtractionRun extended with
-- document-level metadata snapshot).

ALTER TABLE "ExtractionRun"
  ADD COLUMN "metadata" JSONB;
