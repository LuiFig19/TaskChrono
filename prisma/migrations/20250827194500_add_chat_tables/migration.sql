-- Create chat persistence tables
CREATE SCHEMA IF NOT EXISTS "taskchrono";

-- ChatMessage
CREATE TABLE IF NOT EXISTS "taskchrono"."ChatMessage" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- ChatLike
CREATE TABLE IF NOT EXISTS "taskchrono"."ChatLike" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatLike_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ChatMessage_org_channel_ts_idx" ON "taskchrono"."ChatMessage" ("organizationId", "channelId", "ts");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatLike_messageId_userId_key" ON "taskchrono"."ChatLike" ("messageId", "userId");

-- FKs
ALTER TABLE "taskchrono"."ChatMessage"
  ADD CONSTRAINT "ChatMessage_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "taskchrono"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "taskchrono"."ChatLike"
  ADD CONSTRAINT "ChatLike_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "taskchrono"."ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;


