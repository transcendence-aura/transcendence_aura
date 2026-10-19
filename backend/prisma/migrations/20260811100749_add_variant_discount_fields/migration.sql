-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isOnSale" BOOLEAN NOT NULL DEFAULT false;
