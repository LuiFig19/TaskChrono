-- Finalize production DB to match latest Prisma schema
CREATE SCHEMA IF NOT EXISTS "taskchrono";

-- Ensure TimeEntry has required columns
ALTER TABLE "taskchrono"."TimeEntry"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "taskchrono"."TimeEntry" SET "name" = COALESCE("name", 'Timer');

ALTER TABLE "taskchrono"."TimeEntry"
  ALTER COLUMN "name" SET DEFAULT 'Timer',
  ALTER COLUMN "name" SET NOT NULL;

-- Ensure Invoice has required columns
ALTER TABLE "taskchrono"."Invoice"
  ADD COLUMN IF NOT EXISTS "clientName" TEXT,
  ADD COLUMN IF NOT EXISTS "projectName" TEXT,
  ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

-- If legacy columns exist, copy data into new columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Invoice' AND column_name='issuedAt'
  ) THEN
    EXECUTE 'UPDATE "taskchrono"."Invoice" SET "issueDate" = COALESCE("issueDate", "issuedAt")';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Invoice' AND column_name='dueAt'
  ) THEN
    EXECUTE 'UPDATE "taskchrono"."Invoice" SET "dueDate" = COALESCE("dueDate", "dueAt")';
  END IF;
END $$;

-- Backfill minimal values to satisfy NOT NULLs
UPDATE "taskchrono"."Invoice" SET "clientName" = COALESCE("clientName", 'Client');
UPDATE "taskchrono"."Invoice" SET "issueDate" = COALESCE("issueDate", NOW());
UPDATE "taskchrono"."Invoice" SET "dueDate" = COALESCE("dueDate", NOW());

-- Enforce NOT NULLs and defaults
ALTER TABLE "taskchrono"."Invoice"
  ALTER COLUMN "clientName" SET NOT NULL,
  ALTER COLUMN "issueDate" SET NOT NULL,
  ALTER COLUMN "dueDate" SET NOT NULL;

-- Drop legacy columns if they still exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Invoice' AND column_name='issuedAt'
  ) THEN
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" DROP COLUMN "issuedAt"';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Invoice' AND column_name='dueAt'
  ) THEN
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" DROP COLUMN "dueAt"';
  END IF;
END $$;

-- Helpful index for queries (idempotent)
CREATE INDEX IF NOT EXISTS "Invoice_org_status_issueDate_idx"
  ON "taskchrono"."Invoice" ("organizationId", "status", "issueDate");







