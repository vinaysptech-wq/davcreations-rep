/*
  Warnings:

  - Made the column `address` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
UPDATE "public"."users" SET "address" = 'Not provided' WHERE "address" IS NULL;
-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "address" SET NOT NULL;
