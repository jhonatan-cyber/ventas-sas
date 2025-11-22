-- AlterTable
ALTER TABLE "system_support_tickets" ADD COLUMN     "created_by_customer_id" TEXT,
ADD COLUMN     "created_by_sas_user_id" TEXT;

-- CreateIndex
CREATE INDEX "system_support_tickets_created_by_customer_id_idx" ON "system_support_tickets"("created_by_customer_id");

-- CreateIndex
CREATE INDEX "system_support_tickets_created_by_sas_user_id_idx" ON "system_support_tickets"("created_by_sas_user_id");

-- AddForeignKey
ALTER TABLE "system_support_tickets" ADD CONSTRAINT "system_support_tickets_created_by_customer_id_fkey" FOREIGN KEY ("created_by_customer_id") REFERENCES "sales_customer_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_support_tickets" ADD CONSTRAINT "system_support_tickets_created_by_sas_user_id_fkey" FOREIGN KEY ("created_by_sas_user_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
