-- DropForeignKey
ALTER TABLE "public"."system_ticket_attachments" DROP CONSTRAINT "system_ticket_attachments_uploaded_by_id_fkey";

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "system_ticket_attachments" ADD CONSTRAINT "system_ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
