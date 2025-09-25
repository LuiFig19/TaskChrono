-- CreateEnum
CREATE TYPE "taskchrono"."TeamRole" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "taskchrono"."GoalStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'AT_RISK', 'COMPLETE', 'PAUSED');

-- CreateEnum
CREATE TYPE "taskchrono"."KRDirection" AS ENUM ('INCREASE', 'DECREASE', 'AT_LEAST', 'AT_MOST', 'EXACT');

-- CreateTable
CREATE TABLE "taskchrono"."WidgetLayout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dashboard" TEXT NOT NULL DEFAULT 'main',
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamMembership" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "taskchrono"."TeamRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "taskchrono"."TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamNote" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentMd" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousId" TEXT,

    CONSTRAINT "TeamNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamGoal" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "taskchrono"."GoalStatus" NOT NULL DEFAULT 'PLANNED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamKeyResult" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetNumber" DOUBLE PRECISION,
    "currentNumber" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT,
    "direction" "taskchrono"."KRDirection" NOT NULL DEFAULT 'INCREASE',
    "linkedQuery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamKeyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamGoalUpdate" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT,
    "progress" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamGoalUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taskchrono"."TeamActivity" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WidgetLayout_userId_idx" ON "taskchrono"."WidgetLayout"("userId");

-- CreateIndex
CREATE INDEX "WidgetLayout_dashboard_idx" ON "taskchrono"."WidgetLayout"("dashboard");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetLayout_userId_dashboard_key" ON "taskchrono"."WidgetLayout"("userId", "dashboard");

-- CreateIndex
CREATE INDEX "Team_createdById_idx" ON "taskchrono"."Team"("createdById");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_idx" ON "taskchrono"."TeamMembership"("teamId");

-- CreateIndex
CREATE INDEX "TeamMembership_userId_idx" ON "taskchrono"."TeamMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_teamId_userId_key" ON "taskchrono"."TeamMembership"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "taskchrono"."TeamInvite"("token");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_idx" ON "taskchrono"."TeamInvite"("teamId");

-- CreateIndex
CREATE INDEX "TeamNote_teamId_idx" ON "taskchrono"."TeamNote"("teamId");

-- CreateIndex
CREATE INDEX "TeamNote_authorId_idx" ON "taskchrono"."TeamNote"("authorId");

-- CreateIndex
CREATE INDEX "TeamGoal_teamId_idx" ON "taskchrono"."TeamGoal"("teamId");

-- CreateIndex
CREATE INDEX "TeamGoal_ownerId_idx" ON "taskchrono"."TeamGoal"("ownerId");

-- CreateIndex
CREATE INDEX "TeamKeyResult_goalId_idx" ON "taskchrono"."TeamKeyResult"("goalId");

-- CreateIndex
CREATE INDEX "TeamGoalUpdate_goalId_idx" ON "taskchrono"."TeamGoalUpdate"("goalId");

-- CreateIndex
CREATE INDEX "TeamGoalUpdate_authorId_idx" ON "taskchrono"."TeamGoalUpdate"("authorId");

-- CreateIndex
CREATE INDEX "TeamActivity_teamId_idx" ON "taskchrono"."TeamActivity"("teamId");

-- AddForeignKey
ALTER TABLE "taskchrono"."WidgetLayout" ADD CONSTRAINT "WidgetLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "taskchrono"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "taskchrono"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamNote" ADD CONSTRAINT "TeamNote_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamGoal" ADD CONSTRAINT "TeamGoal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamKeyResult" ADD CONSTRAINT "TeamKeyResult_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "taskchrono"."TeamGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamGoalUpdate" ADD CONSTRAINT "TeamGoalUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "taskchrono"."TeamGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskchrono"."TeamActivity" ADD CONSTRAINT "TeamActivity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
