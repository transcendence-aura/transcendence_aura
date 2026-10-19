-- Enforce "one active API key per account" at the DB level. Prisma's schema
-- language can't express partial indexes, so this lives only in the migration.
-- Backstop for the check in ApiKeyService.create(), which is not race-safe
-- under READ COMMITTED.
CREATE UNIQUE INDEX "ApiKey_ownerId_active_key" ON "ApiKey"("ownerId") WHERE "isRevoked" = false;
