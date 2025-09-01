/*
  Warnings:

  - The values [VOID] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `number` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,sku]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,barcode]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "taskchrono"."InvoiceRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "taskchrono"."InventoryActivityType" AS ENUM ('CREATE', 'UPDATE', 'ADJUST', 'DELETE', 'IMPORT');

-- AlterEnum
BEGIN;
CREATE TYPE "taskchrono"."InvoiceStatus_new" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');
ALTER TABLE "taskchrono"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "taskchrono"."Invoice" ALTER COLUMN "status" TYPE "taskchrono"."InvoiceStatus_new" USING ("status"::text::"taskchrono"."InvoiceStatus_new");
ALTER TYPE "taskchrono"."InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "taskchrono"."InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "taskchrono"."InvoiceStatus_old";
ALTER TABLE "taskchrono"."Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "taskchrono"."InventoryItem" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "costCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "minQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "taskchrono"."Invoice" DROP COLUMN "number",
ADD COLUMN     "attachmentsJson" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextIssueDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recurrence" "taskchrono"."InvoiceRecurrence" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "recurrenceEnd" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "taskchrono"."Timer" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "taskchrono"."InventoryCategory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."Supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."InventoryActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "taskchrono"."InventoryActivityType" NOT NULL,
    "message" TEXT,
    "delta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCategory_organizationId_name_key" ON "taskchrono"."InventoryCategory"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_name_key" ON "taskchrono"."Supplier"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_organizationId_sku_key" ON "taskchrono"."InventoryItem"("organizationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_organizationId_barcode_key" ON "taskchrono"."InventoryItem"("organizationId", "barcode");

-- AddForeignKey
ALTER TABLE "taskchrono"."Timer" ADD CONSTRAINT "Timer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "taskchrono"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."Timer" ADD CONSTRAINT "Timer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "taskchrono"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "taskchrono"."InventoryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryItem" ADD CONSTRAINT "InventoryItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "taskchrono"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryItem" ADD CONSTRAINT "InventoryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "taskchrono"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryItem" ADD CONSTRAINT "InventoryItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "taskchrono"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryCategory" ADD CONSTRAINT "InventoryCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "taskchrono"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "taskchrono"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryActivity" ADD CONSTRAINT "InventoryActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "taskchrono"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryActivity" ADD CONSTRAINT "InventoryActivity_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "taskchrono"."InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."InventoryActivity" ADD CONSTRAINT "InventoryActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "taskchrono"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
