/*
  Warnings:

  - You are about to drop the column `category` on the `admin_modules` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."admin_modules" DROP COLUMN "category",
ADD COLUMN     "short_description" TEXT,
ADD COLUMN     "tool_tip" TEXT;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "city",
DROP COLUMN "state";
