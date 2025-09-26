-- Add Team role labels and link TeamMembership.roleLabelId

-- Create TeamRoleLabel table if missing
CREATE TABLE IF NOT EXISTS "taskchrono"."TeamRoleLabel" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRoleLabel_pkey" PRIMARY KEY ("id")
);

-- Unique label name per team
CREATE UNIQUE INDEX IF NOT EXISTS "TeamRoleLabel_teamId_name_key" ON "taskchrono"."TeamRoleLabel"("teamId", "name");

-- Fast lookup by team
CREATE INDEX IF NOT EXISTS "TeamRoleLabel_teamId_idx" ON "taskchrono"."TeamRoleLabel"("teamId");

-- FK: TeamRoleLabel.teamId -> Team.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'TeamRoleLabel_teamId_fkey'
  ) THEN
    ALTER TABLE "taskchrono"."TeamRoleLabel"
      ADD CONSTRAINT "TeamRoleLabel_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "taskchrono"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add roleLabelId to TeamMembership if missing
ALTER TABLE "taskchrono"."TeamMembership"
  ADD COLUMN IF NOT EXISTS "roleLabelId" TEXT;

-- Index for filtering by roleLabelId
CREATE INDEX IF NOT EXISTS "TeamMembership_roleLabelId_idx" ON "taskchrono"."TeamMembership"("roleLabelId");

-- FK: TeamMembership.roleLabelId -> TeamRoleLabel.id (nullable, set null on delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'TeamMembership_roleLabelId_fkey'
  ) THEN
    ALTER TABLE "taskchrono"."TeamMembership"
      ADD CONSTRAINT "TeamMembership_roleLabelId_fkey"
      FOREIGN KEY ("roleLabelId") REFERENCES "taskchrono"."TeamRoleLabel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


