-- CreateTable
CREATE TABLE "DocumentListItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION,
    "flagsRed" INTEGER NOT NULL DEFAULT 0,
    "flagsOrange" INTEGER NOT NULL DEFAULT 0,
    "flagsBlue" INTEGER NOT NULL DEFAULT 0,
    "terminationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "hasUnlimitedLiability" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentListItem_orgId_riskScore_idx" ON "DocumentListItem"("orgId", "riskScore");

-- CreateIndex
CREATE INDEX "DocumentListItem_orgId_uploadedAt_idx" ON "DocumentListItem"("orgId", "uploadedAt");

-- CreateIndex
CREATE INDEX "DocumentListItem_orgId_name_idx" ON "DocumentListItem"("orgId", "name");

-- CreateIndex
CREATE INDEX "DocumentListItem_orgId_status_idx" ON "DocumentListItem"("orgId", "status");

-- AddForeignKey
ALTER TABLE "DocumentListItem" ADD CONSTRAINT "DocumentListItem_id_fkey" FOREIGN KEY ("id") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
