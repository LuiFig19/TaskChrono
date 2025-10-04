-- AlterTable
ALTER TABLE "taskchrono"."Task" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "taskchrono"."TeamGoal" ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_teamId_idx" ON "taskchrono"."Task"("teamId");

-- AddForeignKey
ALTER TABLE "taskchrono"."Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
