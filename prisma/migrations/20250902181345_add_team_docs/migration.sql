/*
  Warnings:

  - You are about to drop the column `pausedAt` on the `TimeEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "taskchrono"."TimeEntry" DROP COLUMN "pausedAt";

-- CreateTable
CREATE TABLE "taskchrono"."TeamDoc" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamDoc_organizationId_updatedAt_idx" ON "taskchrono"."TeamDoc"("organizationId", "updatedAt");

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamDoc" ADD CONSTRAINT "TeamDoc_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "taskchrono"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamDoc" ADD CONSTRAINT "TeamDoc_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "taskchrono"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamDoc" ADD CONSTRAINT "TeamDoc_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "taskchrono"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
