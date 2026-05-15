-- CreateTable
CREATE TABLE "DocumentText" (
    "documentId" TEXT NOT NULL PRIMARY KEY,
    "storageKey" TEXT NOT NULL,
    "textLength" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "minPageConfidence" REAL NOT NULL,
    "language" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "extractedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentText_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "failureReason" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'not_started',
    "userRetryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME
);
INSERT INTO "new_Document" ("completedAt", "createdAt", "failureReason", "id", "name", "orgId", "sizeBytes", "status", "storageKey", "type", "updatedAt", "uploadedBy") SELECT "completedAt", "createdAt", "failureReason", "id", "name", "orgId", "sizeBytes", "status", "storageKey", "type", "updatedAt", "uploadedBy" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE INDEX "Document_orgId_idx" ON "Document"("orgId");
CREATE INDEX "Document_uploadedBy_idx" ON "Document"("uploadedBy");
CREATE INDEX "Document_orgId_status_idx" ON "Document"("orgId", "status");
CREATE INDEX "Document_processingStatus_idx" ON "Document"("processingStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentText_storageKey_key" ON "DocumentText"("storageKey");

-- CreateIndex
CREATE INDEX "DocumentText_driver_idx" ON "DocumentText"("driver");
