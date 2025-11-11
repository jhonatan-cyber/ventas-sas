-- CreateTable
CREATE TABLE "sales_permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_permissions_name_key" ON "sales_permissions"("name");

-- CreateIndex
CREATE INDEX "sales_permissions_module_idx" ON "sales_permissions"("module");

-- CreateIndex
CREATE INDEX "sales_permissions_is_active_idx" ON "sales_permissions"("is_active");

-- CreateIndex
CREATE INDEX "sales_permissions_module_action_idx" ON "sales_permissions"("module", "action");

