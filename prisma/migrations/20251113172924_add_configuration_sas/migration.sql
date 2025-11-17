-- CreateTable
CREATE TABLE "sales_configuration_sas" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "moneda" TEXT DEFAULT 'BOB',
    "format_fecha" TEXT DEFAULT 'dd/MM/yyyy',
    "color" TEXT DEFAULT 'green',
    "zona_horaria" TEXT DEFAULT 'America/La_Paz',
    "idioma" TEXT DEFAULT 'es',
    "decimales" INTEGER DEFAULT 2,
    "formato_numero" TEXT DEFAULT 'standard',
    "notificaciones_habilitadas" BOOLEAN DEFAULT true,
    "guardado_automatico" BOOLEAN DEFAULT true,
    "sucursal_por_defecto_id" TEXT,
    "prefijo_factura" TEXT,
    "formato_numero_factura" TEXT DEFAULT 'sequential',
    "tasa_impuesto" DECIMAL(5,2) DEFAULT 0,
    "pie_recibo" TEXT,
    "numero_whatsapp" TEXT,
    "codigo_pais_whatsapp" TEXT DEFAULT '+591',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_configuration_sas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_configuration_sas_organization_id_key" ON "sales_configuration_sas"("organization_id");

-- CreateIndex
CREATE INDEX "sales_configuration_sas_organization_id_idx" ON "sales_configuration_sas"("organization_id");

-- AddForeignKey
ALTER TABLE "sales_configuration_sas" ADD CONSTRAINT "sales_configuration_sas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_configuration_sas" ADD CONSTRAINT "sales_configuration_sas_sucursal_por_defecto_id_fkey" FOREIGN KEY ("sucursal_por_defecto_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

