-- Align Account and Session tables to Better Auth expected columns in taskchrono schema
-- Idempotent and safe to run multiple times

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS "taskchrono";

-- Account column renames and additions
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='provider'
  ) THEN
    ALTER TABLE "taskchrono"."Account" RENAME COLUMN "provider" TO "providerId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='providerAccountId'
  ) THEN
    ALTER TABLE "taskchrono"."Account" RENAME COLUMN "providerAccountId" TO "accountId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='access_token'
  ) THEN
    ALTER TABLE "taskchrono"."Account" RENAME COLUMN "access_token" TO "accessToken";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='refresh_token'
  ) THEN
    ALTER TABLE "taskchrono"."Account" RENAME COLUMN "refresh_token" TO "refreshToken";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='id_token'
  ) THEN
    ALTER TABLE "taskchrono"."Account" RENAME COLUMN "id_token" TO "idToken";
  END IF;
END $$;

-- Add new columns if missing
ALTER TABLE "taskchrono"."Account"
  ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "password" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill accessTokenExpiresAt from legacy expires_at if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='expires_at'
  ) THEN
    UPDATE "taskchrono"."Account"
      SET "accessTokenExpiresAt" =
        CASE
          WHEN "expires_at" IS NULL THEN NULL
          WHEN "expires_at" > 10000000000 THEN to_timestamp("expires_at"/1000)
          ELSE to_timestamp("expires_at")
        END
      WHERE "accessTokenExpiresAt" IS NULL;
  END IF;
END $$;

-- Drop legacy expires_at column if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='expires_at'
  ) THEN
    ALTER TABLE "taskchrono"."Account" DROP COLUMN "expires_at";
  END IF;
END $$;

-- Recreate unique index to match new column names
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='taskchrono' AND indexname='Account_provider_providerAccountId_key'
  ) THEN
    DROP INDEX "taskchrono"."Account_provider_providerAccountId_key";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key"
  ON "taskchrono"."Account" ("providerId", "accountId");

-- Session additions (keep existing sessionToken/ expires columns mapped)
ALTER TABLE "taskchrono"."Session"
  ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Touch updatedAt to current timestamp
UPDATE "taskchrono"."Session" SET "updatedAt" = NOW() WHERE "updatedAt" IS NOT NULL;
