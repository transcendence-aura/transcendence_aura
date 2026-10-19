/*
  Warnings:

  - Added the required column `heroImageUrl` to the `collections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "heroImageUrl" VARCHAR(500) NOT NULL;
