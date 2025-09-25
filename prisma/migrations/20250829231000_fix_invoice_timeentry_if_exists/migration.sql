-- Safely add required columns in whichever schema currently holds live tables

-- Helper to add columns to Invoice if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Invoice') THEN
    EXECUTE 'ALTER TABLE "public"."Invoice" ADD COLUMN IF NOT EXISTS "clientName" TEXT';
    EXECUTE 'ALTER TABLE "public"."Invoice" ADD COLUMN IF NOT EXISTS "projectName" TEXT';
    EXECUTE 'ALTER TABLE "public"."Invoice" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3)';
    EXECUTE 'ALTER TABLE "public"."Invoice" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3)';
    EXECUTE 'UPDATE "public"."Invoice" SET "clientName" = COALESCE("clientName", ''Client'')';
    EXECUTE 'UPDATE "public"."Invoice" SET "issueDate" = COALESCE("issueDate", NOW())';
    EXECUTE 'UPDATE "public"."Invoice" SET "dueDate" = COALESCE("dueDate", NOW())';
    EXECUTE 'ALTER TABLE "public"."Invoice" ALTER COLUMN "clientName" SET NOT NULL';
    EXECUTE 'ALTER TABLE "public"."Invoice" ALTER COLUMN "issueDate" SET NOT NULL';
    EXECUTE 'ALTER TABLE "public"."Invoice" ALTER COLUMN "dueDate" SET NOT NULL';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='taskchrono' AND table_name='Invoice') THEN
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ADD COLUMN IF NOT EXISTS "clientName" TEXT';
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ADD COLUMN IF NOT EXISTS "projectName" TEXT';
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3)';
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3)';
    EXECUTE 'UPDATE "taskchrono"."Invoice" SET "clientName" = COALESCE("clientName", ''Client'')';
    EXECUTE 'UPDATE "taskchrono"."Invoice" SET "issueDate" = COALESCE("issueDate", NOW())';
    EXECUTE 'UPDATE "taskchrono"."Invoice" SET "dueDate" = COALESCE("dueDate", NOW())';
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ALTER COLUMN "clientName" SET NOT NULL';
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ALTER COLUMN "issueDate" SET NOT NULL';
    EXECUTE 'ALTER TABLE "taskchrono"."Invoice" ALTER COLUMN "dueDate" SET NOT NULL';
  END IF;
END $$;

-- TimeEntry name column in either schema
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='TimeEntry') THEN
    EXECUTE 'ALTER TABLE "public"."TimeEntry" ADD COLUMN IF NOT EXISTS "name" TEXT';
    EXECUTE 'UPDATE "public"."TimeEntry" SET "name" = COALESCE("name", ''Timer'')';
    EXECUTE 'ALTER TABLE "public"."TimeEntry" ALTER COLUMN "name" SET DEFAULT ''Timer''';
    EXECUTE 'ALTER TABLE "public"."TimeEntry" ALTER COLUMN "name" SET NOT NULL';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='taskchrono' AND table_name='TimeEntry') THEN
    EXECUTE 'ALTER TABLE "taskchrono"."TimeEntry" ADD COLUMN IF NOT EXISTS "name" TEXT';
    EXECUTE 'UPDATE "taskchrono"."TimeEntry" SET "name" = COALESCE("name", ''Timer'')';
    EXECUTE 'ALTER TABLE "taskchrono"."TimeEntry" ALTER COLUMN "name" SET DEFAULT ''Timer''';
    EXECUTE 'ALTER TABLE "taskchrono"."TimeEntry" ALTER COLUMN "name" SET NOT NULL';
  END IF;
END $$;







