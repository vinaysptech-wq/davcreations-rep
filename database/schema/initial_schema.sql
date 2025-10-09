-- Initial schema for the database
-- This file contains the SQL commands to create the initial database structure

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "user_typeid" INTEGER NOT NULL,
    "address" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "user_password" TEXT NOT NULL,
    "bank_name" TEXT,
    "bank_ifsc_code" TEXT,
    "bank_account_number" TEXT,
    "bank_address" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."user_type" (
    "user_type_id" SERIAL NOT NULL,
    "user_type_name" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_type_pkey" PRIMARY KEY ("user_type_id")
);

-- CreateTable
CREATE TABLE "public"."admin_modules" (
    "admin_module_id" SERIAL NOT NULL,
    "module_name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "url_slug" TEXT,
    "user_id" INTEGER,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admin_modules_pkey" PRIMARY KEY ("admin_module_id")
);

-- CreateTable
CREATE TABLE "public"."user_access" (
    "user_access_id" SERIAL NOT NULL,
    "admin_module_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_access_pkey" PRIMARY KEY ("user_access_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_user_typeid_fkey" FOREIGN KEY ("user_typeid") REFERENCES "public"."user_type"("user_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_modules" ADD CONSTRAINT "admin_modules_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."admin_modules"("admin_module_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_modules" ADD CONSTRAINT "admin_modules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_access" ADD CONSTRAINT "user_access_admin_module_id_fkey" FOREIGN KEY ("admin_module_id") REFERENCES "public"."admin_modules"("admin_module_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_access" ADD CONSTRAINT "user_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_access" ADD CONSTRAINT "user_access_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;