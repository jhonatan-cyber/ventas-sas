-- DropForeignKey
ALTER TABLE "public"."password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sales_sas_sessions" DROP CONSTRAINT "sales_sas_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "invalidated_tokens" ALTER COLUMN "expires_at" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "profile_sas_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sales_sas_sessions" ADD COLUMN     "profile_sas_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "system_notifications" ADD COLUMN     "profile_sas_id" TEXT;

-- CreateTable
CREATE TABLE "sas_profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "password_changed_at" TIMESTAMP(3),
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "ci" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "two_factor_backup_codes" JSONB,
    "two_factor_enabled_at" TIMESTAMP(3),
    "photo" TEXT,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "sas_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sas_profiles_email_key" ON "sas_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sas_profiles_ci_key" ON "sas_profiles"("ci");

-- CreateIndex
CREATE INDEX "sas_profiles_organization_id_is_active_idx" ON "sas_profiles"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sas_profiles_email_organization_id_idx" ON "sas_profiles"("email", "organization_id");

-- CreateIndex
CREATE INDEX "sas_profiles_ci_organization_id_idx" ON "sas_profiles"("ci", "organization_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_profile_sas_id_idx" ON "password_reset_tokens"("profile_sas_id");

-- CreateIndex
CREATE INDEX "sales_sas_sessions_profile_sas_id_is_active_idx" ON "sales_sas_sessions"("profile_sas_id", "is_active");

-- CreateIndex
CREATE INDEX "system_notifications_profile_sas_id_is_read_created_at_idx" ON "system_notifications"("profile_sas_id", "is_read", "created_at");

-- AddForeignKey
ALTER TABLE "sas_profiles" ADD CONSTRAINT "sas_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sas_sessions" ADD CONSTRAINT "sales_sas_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sas_sessions" ADD CONSTRAINT "sales_sas_sessions_profile_sas_id_fkey" FOREIGN KEY ("profile_sas_id") REFERENCES "sas_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_profile_sas_id_fkey" FOREIGN KEY ("profile_sas_id") REFERENCES "sas_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_profile_sas_id_fkey" FOREIGN KEY ("profile_sas_id") REFERENCES "sas_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
