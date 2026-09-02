-- CreateEnum
CREATE TYPE "TokenRevocationReason" AS ENUM ('ROTATED', 'REUSE_DETECTED', 'EXPIRED', 'LOGOUT', 'ADMIN_REVOKED', 'INACTIVE_USER');

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "revocationReason" "TokenRevocationReason";

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_isRevoked_idx" ON "RefreshToken"("familyId", "isRevoked");
