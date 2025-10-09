-- AlterTable
ALTER TABLE "public"."admin_modules" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "public"."settings" (
    "setting_id" SERIAL NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_setting_key_key" ON "public"."settings"("setting_key");
