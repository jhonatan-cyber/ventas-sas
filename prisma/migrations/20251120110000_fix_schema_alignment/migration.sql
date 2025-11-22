-- Ajustar default de estado de suscripción para alinear con el datamodel
ALTER TABLE "system_organizations"
  ALTER COLUMN "subscription_status" SET DEFAULT 'active';

-- Tabla faltante para tokens de reseteo de contraseña
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX "password_reset_tokens_organization_id_idx" ON "password_reset_tokens"("organization_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Renombrar columna mal codificada para usar solo ASCII
ALTER TABLE "sales_usuarios_sas"
  RENAME COLUMN "contrase├▒a" TO "contrasena";

