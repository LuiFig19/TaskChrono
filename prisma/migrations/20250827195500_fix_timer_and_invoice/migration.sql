CREATE SCHEMA IF NOT EXISTS "taskchrono";

-- Ensure Timer table exists
CREATE TABLE IF NOT EXISTS "taskchrono"."Timer" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "finalizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Timer_pkey" PRIMARY KEY ("id")
);

-- Ensure TimeEntry has timerId FK
ALTER TABLE "taskchrono"."TimeEntry"
  ADD COLUMN IF NOT EXISTS "timerId" TEXT,
  ADD CONSTRAINT IF NOT EXISTS "TimeEntry_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES "taskchrono"."Timer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: nothing to backfill intentionally in migration


