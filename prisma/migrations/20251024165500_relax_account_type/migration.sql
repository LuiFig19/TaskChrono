-- Ensure Account.type exists and is nullable (no NOT NULL) in both taskchrono and public schemas

-- taskchrono
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='type'
  ) THEN
    ALTER TABLE "taskchrono"."Account" ADD COLUMN "type" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='taskchrono' AND table_name='Account' AND column_name='type'
  ) THEN
    ALTER TABLE "taskchrono"."Account" ALTER COLUMN "type" DROP NOT NULL;
  END IF;
END $$;

-- public
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Account' AND column_name='type'
  ) THEN
    ALTER TABLE "public"."Account" ADD COLUMN "type" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Account' AND column_name='type'
  ) THEN
    ALTER TABLE "public"."Account" ALTER COLUMN "type" DROP NOT NULL;
  END IF;
END $$;



