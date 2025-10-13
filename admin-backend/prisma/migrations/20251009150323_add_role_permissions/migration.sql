-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "role_permissions_id" SERIAL NOT NULL,
    "user_type_id" INTEGER NOT NULL,
    "admin_module_id" INTEGER NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_permissions_id")
);

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_user_type_id_fkey" FOREIGN KEY ("user_type_id") REFERENCES "public"."user_type"("user_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_admin_module_id_fkey" FOREIGN KEY ("admin_module_id") REFERENCES "public"."admin_modules"("admin_module_id") ON DELETE RESTRICT ON UPDATE CASCADE;
