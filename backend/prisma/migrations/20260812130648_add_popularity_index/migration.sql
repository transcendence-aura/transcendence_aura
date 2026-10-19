-- AlterTable
ALTER TABLE "products" ADD COLUMN     "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_popularityScore_idx" ON "products"("popularityScore");
