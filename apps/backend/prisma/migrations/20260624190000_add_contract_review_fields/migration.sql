-- Playbook-Driven Contract Review agent: asynchronous review lifecycle
-- persisted on the Document row (the run can outlive the HTTP request).
ALTER TABLE "Document" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "Document" ADD COLUMN "reviewMarkdown" TEXT;
ALTER TABLE "Document" ADD COLUMN "reviewRuntime" TEXT;
ALTER TABLE "Document" ADD COLUMN "reviewError" TEXT;
ALTER TABLE "Document" ADD COLUMN "reviewedAt" TIMESTAMP(3);
