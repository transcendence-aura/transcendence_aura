-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "initiatorId" UUID,
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'ACCEPTED';

-- Backfill: conversations created before initiator tracking existed - treat
-- userOne as the historical initiator so the column can become NOT NULL.
UPDATE "conversations" SET "initiatorId" = "userOneId" WHERE "initiatorId" IS NULL;

ALTER TABLE "conversations" ALTER COLUMN "initiatorId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "conversations_initiatorId_idx" ON "conversations"("initiatorId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
