/*
  Warnings:

  - Added the required column `permissions` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."role_permissions" ADD COLUMN     "permissions" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "public"."permission_audit" (
    "audit_id" SERIAL NOT NULL,
    "role_permissions_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "old_permissions" JSONB,
    "new_permissions" JSONB,
    "change_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_audit_pkey" PRIMARY KEY ("audit_id")
);

-- CreateIndex
CREATE INDEX "permission_audit_role_permissions_id_idx" ON "public"."permission_audit"("role_permissions_id");

-- CreateIndex
CREATE INDEX "permission_audit_user_id_idx" ON "public"."permission_audit"("user_id");

-- CreateIndex
CREATE INDEX "permission_audit_created_date_idx" ON "public"."permission_audit"("created_date");

-- CreateIndex
CREATE INDEX "role_permissions_user_type_id_admin_module_id_idx" ON "public"."role_permissions"("user_type_id", "admin_module_id");

-- CreateIndex
CREATE INDEX "role_permissions_is_active_idx" ON "public"."role_permissions"("is_active");

-- AddForeignKey
ALTER TABLE "public"."permission_audit" ADD CONSTRAINT "permission_audit_role_permissions_id_fkey" FOREIGN KEY ("role_permissions_id") REFERENCES "public"."role_permissions"("role_permissions_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_audit" ADD CONSTRAINT "permission_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
