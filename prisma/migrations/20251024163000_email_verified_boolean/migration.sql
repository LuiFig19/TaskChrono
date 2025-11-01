-- Convert emailVerified to boolean for Better Auth compatibility
-- Idempotent for both taskchrono and public schemas

-- taskchrono schema
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='User' AND column_name='emailVerified' AND data_type IN ('timestamp without time zone','timestamp with time zone')
  ) THEN
    ALTER TABLE "taskchrono"."User" ALTER COLUMN "emailVerified" DROP DEFAULT;
    ALTER TABLE "taskchrono"."User" ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL);
    ALTER TABLE "taskchrono"."User" ALTER COLUMN "emailVerified" SET DEFAULT false;
    ALTER TABLE "taskchrono"."User" ALTER COLUMN "emailVerified" SET NOT NULL;
  END IF;
END $$;

-- public schema
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='User' AND column_name='emailVerified' AND data_type IN ('timestamp without time zone','timestamp with time zone')
  ) THEN
    ALTER TABLE "public"."User" ALTER COLUMN "emailVerified" DROP DEFAULT;
    ALTER TABLE "public"."User" ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL);
    ALTER TABLE "public"."User" ALTER COLUMN "emailVerified" SET DEFAULT false;
    ALTER TABLE "public"."User" ALTER COLUMN "emailVerified" SET NOT NULL;
  END IF;
END $$;



