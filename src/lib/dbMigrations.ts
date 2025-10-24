import { prisma } from '@/lib/prisma'

/**
 * Ensures production DB has Better Auth expected columns.
 * - Renames legacy NextAuth columns to Better Auth names (provider->providerId, providerAccountId->accountId, etc.)
 * - Adds missing columns idempotently
 * Safe to run multiple times and on both taskchrono and public schemas.
 */
export async function ensureBetterAuthSchema(): Promise<void> {
  try {
    // Rename columns if legacy names exist (taskchrono schema)
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='providerAccountId'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='accountId'
        ) THEN
          ALTER TABLE "taskchrono"."Account" RENAME COLUMN "providerAccountId" TO "accountId";
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='provider'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='providerId'
        ) THEN
          ALTER TABLE "taskchrono"."Account" RENAME COLUMN "provider" TO "providerId";
        END IF;
      END $$;
    `)

    // Also handle public schema (some deployments used public tables)
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='Account' AND column_name='providerAccountId'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='Account' AND column_name='accountId'
        ) THEN
          ALTER TABLE "public"."Account" RENAME COLUMN "providerAccountId" TO "accountId";
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='Account' AND column_name='provider'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='Account' AND column_name='providerId'
        ) THEN
          ALTER TABLE "public"."Account" RENAME COLUMN "provider" TO "providerId";
        END IF;
      END $$;
    `)

    // Add commonly missing columns (idempotent)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "taskchrono"."Account"
        ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
        ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
        ADD COLUMN IF NOT EXISTS "idToken" TEXT,
        ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "password" TEXT,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `).catch(() => {})

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Account"
        ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
        ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
        ADD COLUMN IF NOT EXISTS "idToken" TEXT,
        ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "password" TEXT,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `).catch(() => {})

    // Recreate unique index if legacy index name exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname='taskchrono' AND indexname='Account_provider_providerAccountId_key'
        ) THEN
          DROP INDEX "taskchrono"."Account_provider_providerAccountId_key";
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key"
      ON "taskchrono"."Account" ("providerId", "accountId");
    `)

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='Account_provider_providerAccountId_key'
        ) THEN
          DROP INDEX "public"."Account_provider_providerAccountId_key";
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key_public"
      ON "public"."Account" ("providerId", "accountId");
    `)
  } catch {
    // Best-effort; keep app functioning even if permissions restrict DDL
  }
}


