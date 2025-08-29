-- Align PUBLIC schema to the latest Prisma schema used by the app

-- TimeEntry: ensure name + notes
ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "TimeEntry" SET "name" = COALESCE("name", 'Timer');

ALTER TABLE "TimeEntry"
  ALTER COLUMN "name" SET DEFAULT 'Timer',
  ALTER COLUMN "name" SET NOT NULL;

-- Timer: ensure table exists and FK from TimeEntry
CREATE TABLE IF NOT EXISTS "Timer" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "finalizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Timer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "timerId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'TimeEntry_timerId_fkey'
  ) THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES "Timer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Invoice: ensure new columns and remove legacy
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "clientName" TEXT,
  ADD COLUMN IF NOT EXISTS "projectName" TEXT,
  ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Invoice' AND column_name='issuedAt') THEN
    EXECUTE 'UPDATE "Invoice" SET "issueDate" = COALESCE("issueDate", "issuedAt")';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Invoice' AND column_name='dueAt') THEN
    EXECUTE 'UPDATE "Invoice" SET "dueDate" = COALESCE("dueDate", "dueAt")';
  END IF;
END $$;

UPDATE "Invoice" SET "clientName" = COALESCE("clientName", 'Client');
UPDATE "Invoice" SET "issueDate" = COALESCE("issueDate", NOW());
UPDATE "Invoice" SET "dueDate" = COALESCE("dueDate", NOW());

ALTER TABLE "Invoice"
  ALTER COLUMN "clientName" SET NOT NULL,
  ALTER COLUMN "issueDate" SET NOT NULL,
  ALTER COLUMN "dueDate" SET NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Invoice' AND column_name='issuedAt') THEN
    EXECUTE 'ALTER TABLE "Invoice" DROP COLUMN "issuedAt"';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Invoice' AND column_name='dueAt') THEN
    EXECUTE 'ALTER TABLE "Invoice" DROP COLUMN "dueAt"';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Invoice_org_status_issueDate_idx_public" ON "Invoice" ("organizationId", "status", "issueDate");

-- Chat tables in PUBLIC if missing
CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatLike" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatLike_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='ChatLike_messageId_fkey'
  ) THEN
    ALTER TABLE "ChatLike" ADD CONSTRAINT "ChatLike_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ChatMessage_org_channel_ts_idx_public" ON "ChatMessage" ("organizationId", "channelId", "ts");


