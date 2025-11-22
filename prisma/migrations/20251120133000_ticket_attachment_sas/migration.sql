-- Permitir adjuntos subidos por usuarios SAS y registrar esa referencia
ALTER TABLE "system_ticket_attachments"
  ALTER COLUMN "uploaded_by_id" DROP NOT NULL;

ALTER TABLE "system_ticket_attachments"
  ADD COLUMN "uploaded_by_sas_user_id" TEXT;

CREATE INDEX "system_ticket_attachments_uploaded_by_id_idx"
  ON "system_ticket_attachments"("uploaded_by_id");

CREATE INDEX "system_ticket_attachments_uploaded_by_sas_user_id_idx"
  ON "system_ticket_attachments"("uploaded_by_sas_user_id");

ALTER TABLE "system_ticket_attachments"
  ADD CONSTRAINT "system_ticket_attachments_uploaded_by_sas_user_id_fkey"
  FOREIGN KEY ("uploaded_by_sas_user_id") REFERENCES "sales_usuarios_sas"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

