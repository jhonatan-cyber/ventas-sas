-- CreateEnum
CREATE TYPE "OrganizationSubscriptionStatus" AS ENUM ('active', 'trial', 'suspended');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- CreateEnum
CREATE TYPE "SubscriptionBillingPeriod" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('completed', 'pending', 'cancelled');

-- CreateEnum
CREATE TYPE "SalePaymentMethod" AS ENUM ('cash', 'card', 'transfer', 'qr');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('active', 'pending', 'converted', 'expired', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "system_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "password_changed_at" TIMESTAMP(3),
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
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

    CONSTRAINT "system_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "subscription_plan_id" TEXT,
    "subscription_status" "OrganizationSubscriptionStatus" NOT NULL DEFAULT 'trial',
    "subscription_start_date" TIMESTAMP(3),
    "subscription_end_date" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "nit" TEXT,
    "razon_social" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,

    CONSTRAINT "system_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2),
    "price_yearly" DECIMAL(10,2),
    "has_monthly" BOOLEAN NOT NULL DEFAULT false,
    "has_yearly" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB,
    "modules" JSONB,
    "max_users" INTEGER,
    "max_products" INTEGER,
    "max_orders" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "billing_period" "SubscriptionBillingPeriod" NOT NULL DEFAULT 'monthly',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_customer_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ci" TEXT,
    "nombre" TEXT,
    "apellido" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "password" TEXT,
    "city" TEXT,
    "country" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_customer_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_customer_organizations" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_customer_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_products_legacy" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "category" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_products_legacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_roles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "barcode" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "branch_id" TEXT,

    CONSTRAINT "sales_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_customers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "ruc" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_sales" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "sale_number" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'completed',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" "SalePaymentMethod" NOT NULL DEFAULT 'cash',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tracking_codes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "quotation_number" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'active',
    "branch_id" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotation_items" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_expenses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cash_registers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch_id" TEXT,
    "opening_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "last_open_at" TIMESTAMP(3),
    "last_close_at" TIMESTAMP(3),
    "opened_by_id" TEXT,
    "closed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_roles_sas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "sucursal_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "sales_roles_sas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_usuarios_sas" (
    "id" TEXT NOT NULL,
    "ci" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "contrase├▒a" TEXT,
    "password_changed_at" TIMESTAMP(3),
    "rol_id" TEXT,
    "foto" TEXT,
    "sucursal_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "two_factor_backup_codes" JSONB,
    "two_factor_enabled_at" TIMESTAMP(3),
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "sales_usuarios_sas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_sas_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_info" JSONB,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "sales_sas_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_security_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT,
    "customer_id" TEXT,
    "organization_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_jwt_secrets" (
    "id" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "secret_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),

    CONSTRAINT "system_jwt_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "system_type" TEXT NOT NULL,
    "customer_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_info" JSONB,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_password_changes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "system_type" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidated_sessions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "system_password_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "user_id" TEXT,
    "usuario_sas_id" TEXT,
    "organization_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config_history" (
    "id" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_config_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_backups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "file_path" TEXT,
    "file_size" BIGINT,
    "database_name" TEXT NOT NULL,
    "schema_only" BOOLEAN NOT NULL DEFAULT false,
    "compressed" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "retention_days" INTEGER,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_email_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "from_name" TEXT,
    "reply_to" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last_tested_at" TIMESTAMP(3),
    "last_test_result" TEXT,
    "last_test_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "system_email_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_alert_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "threshold" JSONB,
    "conditions" JSONB NOT NULL,
    "channels" JSONB NOT NULL,
    "recipients" JSONB,
    "frequency" TEXT NOT NULL DEFAULT 'immediate',
    "last_triggered_at" TIMESTAMP(3),
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_integration_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "credentials" JSONB,
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
    "test_mode" BOOLEAN NOT NULL DEFAULT true,
    "last_tested_at" TIMESTAMP(3),
    "last_test_result" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "system_integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "organization_id" TEXT,
    "subscription_id" TEXT,
    "subscription_plan_id" TEXT,
    "billing_name" TEXT NOT NULL,
    "billing_email" TEXT NOT NULL,
    "billing_address" TEXT,
    "billing_tax_id" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "payment_method_id" TEXT,
    "payment_gateway" TEXT,
    "payment_gateway_id" TEXT,
    "payment_link" TEXT,
    "reminder_sent_at" TIMESTAMP(3),
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "payment_method_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_gateway" TEXT NOT NULL,
    "payment_gateway_id" TEXT,
    "payment_intent_id" TEXT,
    "payment_method_type" TEXT,
    "last4" TEXT,
    "brand" TEXT,
    "paid_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "receipt_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_payment_methods" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "last4" TEXT,
    "brand" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "gateway_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "assigned_to_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ticket_comments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "comment_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ticket_history" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "changed_by_id" TEXT,
    "change_type" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_ticket_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_white_label_branding" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "custom_email_domain" TEXT,
    "custom_email_from" TEXT,
    "company_name" TEXT,
    "company_website" TEXT,
    "custom_landing_page" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_white_label_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_cms_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "page_type" TEXT NOT NULL DEFAULT 'page',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT,
    "template" TEXT NOT NULL DEFAULT 'minimal',

    CONSTRAINT "system_cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_cms_blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featured_image" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT,

    CONSTRAINT "system_cms_blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_user_feedback" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "user_id" TEXT,
    "user_type" TEXT NOT NULL DEFAULT 'admin',
    "category" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "votes" INTEGER NOT NULL DEFAULT 0,
    "admin_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_feedback_votes" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_feedback_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "version_name" TEXT,
    "release_type" TEXT NOT NULL DEFAULT 'patch',
    "changelog" TEXT NOT NULL,
    "release_notes" TEXT,
    "is_released" BOOLEAN NOT NULL DEFAULT false,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "released_at" TIMESTAMP(3),
    "release_url" TEXT,
    "download_url" TEXT,
    "rollback_available" BOOLEAN NOT NULL DEFAULT false,
    "breaking_changes" BOOLEAN NOT NULL DEFAULT false,
    "migration_required" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_version_notifications" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "notification_type" TEXT NOT NULL DEFAULT 'all',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_version_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "test_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organization_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "target_audience" JSONB,
    "success_metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "system_ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ab_test_variants" (
    "id" TEXT NOT NULL,
    "ab_test_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variant_data" JSONB NOT NULL,
    "traffic_percentage" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "is_control" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_ab_test_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ab_test_participants" (
    "id" TEXT NOT NULL,
    "ab_test_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "customer_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted_at" TIMESTAMP(3),
    "converted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "system_ab_test_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ab_test_events" (
    "id" TEXT NOT NULL,
    "ab_test_id" TEXT NOT NULL,
    "participant_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_ab_test_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_custom_domains" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verification_token" TEXT,
    "verification_method" TEXT,
    "verified_at" TIMESTAMP(3),
    "ssl_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ssl_certificate" JSONB,
    "ssl_issued_at" TIMESTAMP(3),
    "ssl_expires_at" TIMESTAMP(3),
    "redirect_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_custom_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_custom_domain_dns_records" (
    "id" TEXT NOT NULL,
    "custom_domain_id" TEXT NOT NULL,
    "record_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "ttl" INTEGER NOT NULL DEFAULT 3600,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_custom_domain_dns_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon_url" TEXT,
    "logo_url" TEXT,
    "documentation_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "requires_config" BOOLEAN NOT NULL DEFAULT true,
    "config_schema" JSONB,
    "installation_steps" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "system_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_organization_integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'installed',
    "config" JSONB,
    "credentials" JSONB,
    "last_tested_at" TIMESTAMP(3),
    "last_test_result" TEXT,
    "last_test_message" TEXT,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "installed_by_id" TEXT,

    CONSTRAINT "system_organization_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_integration_events" (
    "id" TEXT NOT NULL,
    "organization_integration_id" TEXT,
    "integration_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_users_email_key" ON "system_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_users_ci_key" ON "system_users"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "system_organizations_slug_key" ON "system_organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "system_subscription_plans_name_key" ON "system_subscription_plans"("name");

-- CreateIndex
CREATE INDEX "system_subscriptions_organization_id_status_idx" ON "system_subscriptions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "system_subscriptions_end_date_idx" ON "system_subscriptions"("end_date");

-- CreateIndex
CREATE INDEX "system_subscriptions_status_end_date_idx" ON "system_subscriptions"("status", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_name_key" ON "system_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "system_permissions_name_key" ON "system_permissions"("name");

-- CreateIndex
CREATE INDEX "system_permissions_module_idx" ON "system_permissions"("module");

-- CreateIndex
CREATE INDEX "system_permissions_is_active_idx" ON "system_permissions"("is_active");

-- CreateIndex
CREATE INDEX "system_permissions_module_action_idx" ON "system_permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "sales_organization_members_organization_id_user_id_key" ON "sales_organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_customer_accounts_ci_key" ON "sales_customer_accounts"("ci");

-- CreateIndex
CREATE INDEX "sales_customer_accounts_deleted_at_idx" ON "sales_customer_accounts"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_customer_organizations_organization_id_idx" ON "sales_customer_organizations"("organization_id");

-- CreateIndex
CREATE INDEX "sales_customer_organizations_customer_id_is_active_idx" ON "sales_customer_organizations"("customer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sales_customer_organizations_customer_id_organization_id_key" ON "sales_customer_organizations"("customer_id", "organization_id");

-- CreateIndex
CREATE INDEX "sales_products_legacy_organization_id_stock_idx" ON "sales_products_legacy"("organization_id", "stock");

-- CreateIndex
CREATE INDEX "sales_products_legacy_organization_id_created_at_idx" ON "sales_products_legacy"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_products_legacy_sku_idx" ON "sales_products_legacy"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_key" ON "sales_orders"("order_number");

-- CreateIndex
CREATE INDEX "sales_orders_organization_id_created_at_idx" ON "sales_orders"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_orders_status_created_at_idx" ON "sales_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "sales_orders_order_number_idx" ON "sales_orders"("order_number");

-- CreateIndex
CREATE INDEX "sales_order_items_product_id_order_id_idx" ON "sales_order_items"("product_id", "order_id");

-- CreateIndex
CREATE INDEX "sales_order_items_order_id_idx" ON "sales_order_items"("order_id");

-- CreateIndex
CREATE INDEX "sales_categories_deleted_at_idx" ON "sales_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_roles_deleted_at_idx" ON "sales_roles"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_roles_organization_id_is_active_idx" ON "sales_roles"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_users_organization_id_is_active_idx" ON "sales_users"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_users_email_organization_id_idx" ON "sales_users"("email", "organization_id");

-- CreateIndex
CREATE INDEX "sales_products_organization_id_is_active_idx" ON "sales_products"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_products_organization_id_stock_idx" ON "sales_products"("organization_id", "stock");

-- CreateIndex
CREATE INDEX "sales_products_branch_id_is_active_idx" ON "sales_products"("branch_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_products_branch_id_stock_idx" ON "sales_products"("branch_id", "stock");

-- CreateIndex
CREATE INDEX "sales_products_sku_organization_id_idx" ON "sales_products"("sku", "organization_id");

-- CreateIndex
CREATE INDEX "sales_products_barcode_organization_id_idx" ON "sales_products"("barcode", "organization_id");

-- CreateIndex
CREATE INDEX "sales_products_category_id_idx" ON "sales_products"("category_id");

-- CreateIndex
CREATE INDEX "sales_products_deleted_at_idx" ON "sales_products"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_customers_organization_id_is_active_idx" ON "sales_customers"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_customers_email_organization_id_idx" ON "sales_customers"("email", "organization_id");

-- CreateIndex
CREATE INDEX "sales_customers_ruc_organization_id_idx" ON "sales_customers"("ruc", "organization_id");

-- CreateIndex
CREATE INDEX "sales_customers_deleted_at_idx" ON "sales_customers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sales_sale_number_key" ON "sales_sales"("sale_number");

-- CreateIndex
CREATE INDEX "sales_sales_organization_id_created_at_idx" ON "sales_sales"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_sales_customer_id_created_at_idx" ON "sales_sales"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_sales_user_id_created_at_idx" ON "sales_sales"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_sales_sale_number_idx" ON "sales_sales"("sale_number");

-- CreateIndex
CREATE INDEX "sales_sale_items_product_id_sale_id_idx" ON "sales_sale_items"("product_id", "sale_id");

-- CreateIndex
CREATE INDEX "sales_sale_items_sale_id_idx" ON "sales_sale_items"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotations_quotation_number_key" ON "sales_quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "sales_quotations_organization_id_created_at_idx" ON "sales_quotations"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_quotations_customer_id_created_at_idx" ON "sales_quotations"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_quotations_status_created_at_idx" ON "sales_quotations"("status", "created_at");

-- CreateIndex
CREATE INDEX "sales_quotations_quotation_number_idx" ON "sales_quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "sales_quotation_items_quotation_id_idx" ON "sales_quotation_items"("quotation_id");

-- CreateIndex
CREATE INDEX "sales_quotation_items_product_id_quotation_id_idx" ON "sales_quotation_items"("product_id", "quotation_id");

-- CreateIndex
CREATE INDEX "sales_expenses_organization_id_date_idx" ON "sales_expenses"("organization_id", "date");

-- CreateIndex
CREATE INDEX "sales_expenses_user_id_date_idx" ON "sales_expenses"("user_id", "date");

-- CreateIndex
CREATE INDEX "sales_expenses_branch_id_date_idx" ON "sales_expenses"("branch_id", "date");

-- CreateIndex
CREATE INDEX "sales_expenses_category_date_idx" ON "sales_expenses"("category", "date");

-- CreateIndex
CREATE INDEX "sales_cash_registers_organization_id_is_open_idx" ON "sales_cash_registers"("organization_id", "is_open");

-- CreateIndex
CREATE INDEX "sales_cash_registers_branch_id_is_open_idx" ON "sales_cash_registers"("branch_id", "is_open");

-- CreateIndex
CREATE INDEX "sales_branches_deleted_at_idx" ON "sales_branches"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_roles_sas_organization_id_idx" ON "sales_roles_sas"("organization_id");

-- CreateIndex
CREATE INDEX "sales_roles_sas_deleted_at_idx" ON "sales_roles_sas"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_usuarios_sas_ci_key" ON "sales_usuarios_sas"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "sales_usuarios_sas_correo_key" ON "sales_usuarios_sas"("correo");

-- CreateIndex
CREATE INDEX "sales_usuarios_sas_organization_id_is_active_idx" ON "sales_usuarios_sas"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_usuarios_sas_correo_organization_id_idx" ON "sales_usuarios_sas"("correo", "organization_id");

-- CreateIndex
CREATE INDEX "sales_usuarios_sas_ci_organization_id_idx" ON "sales_usuarios_sas"("ci", "organization_id");

-- CreateIndex
CREATE INDEX "sales_usuarios_sas_deleted_at_idx" ON "sales_usuarios_sas"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sas_sessions_session_token_key" ON "sales_sas_sessions"("session_token");

-- CreateIndex
CREATE INDEX "sales_sas_sessions_user_id_is_active_idx" ON "sales_sas_sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_sas_sessions_organization_id_is_active_idx" ON "sales_sas_sessions"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "sales_sas_sessions_session_token_idx" ON "sales_sas_sessions"("session_token");

-- CreateIndex
CREATE INDEX "sales_sas_sessions_last_activity_at_idx" ON "sales_sas_sessions"("last_activity_at");

-- CreateIndex
CREATE INDEX "sales_sas_sessions_expires_at_idx" ON "sales_sas_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "system_security_logs_user_id_created_at_idx" ON "system_security_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "system_security_logs_customer_id_created_at_idx" ON "system_security_logs"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "system_security_logs_organization_id_created_at_idx" ON "system_security_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "system_security_logs_type_created_at_idx" ON "system_security_logs"("type", "created_at");

-- CreateIndex
CREATE INDEX "system_security_logs_ip_address_created_at_idx" ON "system_security_logs"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "system_security_logs_success_created_at_idx" ON "system_security_logs"("success", "created_at");

-- CreateIndex
CREATE INDEX "system_jwt_secrets_systemType_is_active_idx" ON "system_jwt_secrets"("systemType", "is_active");

-- CreateIndex
CREATE INDEX "system_jwt_secrets_expires_at_idx" ON "system_jwt_secrets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_jwt_secrets_systemType_version_key" ON "system_jwt_secrets"("systemType", "version");

-- CreateIndex
CREATE UNIQUE INDEX "system_user_sessions_session_token_key" ON "system_user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "system_user_sessions_user_id_is_active_idx" ON "system_user_sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "system_user_sessions_session_token_idx" ON "system_user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "system_user_sessions_system_type_is_active_idx" ON "system_user_sessions"("system_type", "is_active");

-- CreateIndex
CREATE INDEX "system_user_sessions_customer_id_is_active_idx" ON "system_user_sessions"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "system_user_sessions_last_activity_at_idx" ON "system_user_sessions"("last_activity_at");

-- CreateIndex
CREATE INDEX "system_user_sessions_expires_at_idx" ON "system_user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "system_password_changes_user_id_changed_at_idx" ON "system_password_changes"("user_id", "changed_at");

-- CreateIndex
CREATE INDEX "system_password_changes_system_type_changed_at_idx" ON "system_password_changes"("system_type", "changed_at");

-- CreateIndex
CREATE INDEX "system_notifications_user_id_is_read_created_at_idx" ON "system_notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "system_notifications_usuario_sas_id_is_read_created_at_idx" ON "system_notifications"("usuario_sas_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "system_notifications_organization_id_is_read_created_at_idx" ON "system_notifications"("organization_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "system_notifications_type_created_at_idx" ON "system_notifications"("type", "created_at");

-- CreateIndex
CREATE INDEX "system_notifications_expires_at_idx" ON "system_notifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");

-- CreateIndex
CREATE INDEX "system_configs_key_category_idx" ON "system_configs"("key", "category");

-- CreateIndex
CREATE INDEX "system_config_history_config_key_created_at_idx" ON "system_config_history"("config_key", "created_at");

-- CreateIndex
CREATE INDEX "system_config_history_changed_by_created_at_idx" ON "system_config_history"("changed_by", "created_at");

-- CreateIndex
CREATE INDEX "system_backups_status_created_at_idx" ON "system_backups"("status", "created_at");

-- CreateIndex
CREATE INDEX "system_backups_type_created_at_idx" ON "system_backups"("type", "created_at");

-- CreateIndex
CREATE INDEX "system_backups_created_by_created_at_idx" ON "system_backups"("created_by", "created_at");

-- CreateIndex
CREATE INDEX "system_backups_expires_at_idx" ON "system_backups"("expires_at");

-- CreateIndex
CREATE INDEX "system_email_configs_is_active_is_default_idx" ON "system_email_configs"("is_active", "is_default");

-- CreateIndex
CREATE INDEX "system_alert_configs_type_enabled_idx" ON "system_alert_configs"("type", "enabled");

-- CreateIndex
CREATE INDEX "system_alert_configs_enabled_type_idx" ON "system_alert_configs"("enabled", "type");

-- CreateIndex
CREATE INDEX "system_integration_configs_type_enabled_idx" ON "system_integration_configs"("type", "enabled");

-- CreateIndex
CREATE INDEX "system_integration_configs_provider_type_idx" ON "system_integration_configs"("provider", "type");

-- CreateIndex
CREATE UNIQUE INDEX "system_invoices_invoice_number_key" ON "system_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "system_invoices_organization_id_status_created_at_idx" ON "system_invoices"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "system_invoices_subscription_id_status_idx" ON "system_invoices"("subscription_id", "status");

-- CreateIndex
CREATE INDEX "system_invoices_status_due_date_idx" ON "system_invoices"("status", "due_date");

-- CreateIndex
CREATE INDEX "system_invoices_invoice_number_idx" ON "system_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "system_invoices_due_date_idx" ON "system_invoices"("due_date");

-- CreateIndex
CREATE INDEX "system_invoices_issue_date_idx" ON "system_invoices"("issue_date");

-- CreateIndex
CREATE INDEX "system_payments_invoice_id_status_idx" ON "system_payments"("invoice_id", "status");

-- CreateIndex
CREATE INDEX "system_payments_payment_gateway_payment_gateway_id_idx" ON "system_payments"("payment_gateway", "payment_gateway_id");

-- CreateIndex
CREATE INDEX "system_payments_status_created_at_idx" ON "system_payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "system_payments_paid_at_idx" ON "system_payments"("paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_payment_methods_gateway_id_key" ON "system_payment_methods"("gateway_id");

-- CreateIndex
CREATE INDEX "system_payment_methods_organization_id_is_active_is_default_idx" ON "system_payment_methods"("organization_id", "is_active", "is_default");

-- CreateIndex
CREATE INDEX "system_payment_methods_type_provider_idx" ON "system_payment_methods"("type", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "system_support_tickets_ticket_number_key" ON "system_support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "system_support_tickets_organization_id_status_created_at_idx" ON "system_support_tickets"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "system_support_tickets_assigned_to_id_status_idx" ON "system_support_tickets"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "system_support_tickets_status_priority_created_at_idx" ON "system_support_tickets"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "system_support_tickets_ticket_number_idx" ON "system_support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "system_ticket_comments_ticket_id_created_at_idx" ON "system_ticket_comments"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "system_ticket_comments_author_id_author_type_idx" ON "system_ticket_comments"("author_id", "author_type");

-- CreateIndex
CREATE INDEX "system_ticket_attachments_ticket_id_idx" ON "system_ticket_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "system_ticket_attachments_comment_id_idx" ON "system_ticket_attachments"("comment_id");

-- CreateIndex
CREATE INDEX "system_ticket_history_ticket_id_created_at_idx" ON "system_ticket_history"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "system_ticket_history_change_type_created_at_idx" ON "system_ticket_history"("change_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_white_label_branding_organization_id_key" ON "system_white_label_branding"("organization_id");

-- CreateIndex
CREATE INDEX "system_cms_pages_slug_is_published_idx" ON "system_cms_pages"("slug", "is_published");

-- CreateIndex
CREATE INDEX "system_cms_pages_page_type_is_published_idx" ON "system_cms_pages"("page_type", "is_published");

-- CreateIndex
CREATE INDEX "system_cms_pages_organization_id_is_published_idx" ON "system_cms_pages"("organization_id", "is_published");

-- CreateIndex
CREATE INDEX "system_cms_pages_organization_id_page_type_idx" ON "system_cms_pages"("organization_id", "page_type");

-- CreateIndex
CREATE UNIQUE INDEX "system_cms_pages_organization_id_slug_key" ON "system_cms_pages"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "system_cms_blog_posts_slug_is_published_idx" ON "system_cms_blog_posts"("slug", "is_published");

-- CreateIndex
CREATE INDEX "system_cms_blog_posts_category_is_published_idx" ON "system_cms_blog_posts"("category", "is_published");

-- CreateIndex
CREATE INDEX "system_cms_blog_posts_published_at_idx" ON "system_cms_blog_posts"("published_at");

-- CreateIndex
CREATE INDEX "system_cms_blog_posts_organization_id_is_published_idx" ON "system_cms_blog_posts"("organization_id", "is_published");

-- CreateIndex
CREATE INDEX "system_cms_blog_posts_organization_id_category_idx" ON "system_cms_blog_posts"("organization_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "system_cms_blog_posts_organization_id_slug_key" ON "system_cms_blog_posts"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "system_user_feedback_category_status_idx" ON "system_user_feedback"("category", "status");

-- CreateIndex
CREATE INDEX "system_user_feedback_status_created_at_idx" ON "system_user_feedback"("status", "created_at");

-- CreateIndex
CREATE INDEX "system_user_feedback_organization_id_status_idx" ON "system_user_feedback"("organization_id", "status");

-- CreateIndex
CREATE INDEX "system_feedback_votes_feedback_id_idx" ON "system_feedback_votes"("feedback_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_feedback_votes_feedback_id_user_id_user_type_key" ON "system_feedback_votes"("feedback_id", "user_id", "user_type");

-- CreateIndex
CREATE UNIQUE INDEX "system_versions_version_key" ON "system_versions"("version");

-- CreateIndex
CREATE INDEX "system_versions_version_idx" ON "system_versions"("version");

-- CreateIndex
CREATE INDEX "system_versions_is_released_released_at_idx" ON "system_versions"("is_released", "released_at");

-- CreateIndex
CREATE INDEX "system_versions_is_current_idx" ON "system_versions"("is_current");

-- CreateIndex
CREATE INDEX "system_version_notifications_version_id_is_read_idx" ON "system_version_notifications"("version_id", "is_read");

-- CreateIndex
CREATE INDEX "system_version_notifications_user_id_is_read_idx" ON "system_version_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "system_version_notifications_organization_id_is_read_idx" ON "system_version_notifications"("organization_id", "is_read");

-- CreateIndex
CREATE INDEX "system_ab_tests_test_type_status_idx" ON "system_ab_tests"("test_type", "status");

-- CreateIndex
CREATE INDEX "system_ab_tests_organization_id_status_idx" ON "system_ab_tests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "system_ab_tests_status_start_date_idx" ON "system_ab_tests"("status", "start_date");

-- CreateIndex
CREATE INDEX "system_ab_test_variants_ab_test_id_idx" ON "system_ab_test_variants"("ab_test_id");

-- CreateIndex
CREATE INDEX "system_ab_test_participants_ab_test_id_variant_id_idx" ON "system_ab_test_participants"("ab_test_id", "variant_id");

-- CreateIndex
CREATE INDEX "system_ab_test_participants_ab_test_id_converted_idx" ON "system_ab_test_participants"("ab_test_id", "converted");

-- CreateIndex
CREATE UNIQUE INDEX "system_ab_test_participants_ab_test_id_user_id_organization_key" ON "system_ab_test_participants"("ab_test_id", "user_id", "organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "system_ab_test_events_ab_test_id_event_type_created_at_idx" ON "system_ab_test_events"("ab_test_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "system_ab_test_events_participant_id_created_at_idx" ON "system_ab_test_events"("participant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_custom_domains_domain_key" ON "system_custom_domains"("domain");

-- CreateIndex
CREATE INDEX "system_custom_domains_organization_id_status_idx" ON "system_custom_domains"("organization_id", "status");

-- CreateIndex
CREATE INDEX "system_custom_domains_status_verified_at_idx" ON "system_custom_domains"("status", "verified_at");

-- CreateIndex
CREATE INDEX "system_custom_domain_dns_records_custom_domain_id_record_ty_idx" ON "system_custom_domain_dns_records"("custom_domain_id", "record_type");

-- CreateIndex
CREATE INDEX "system_custom_domain_dns_records_custom_domain_id_verified_idx" ON "system_custom_domain_dns_records"("custom_domain_id", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "system_integrations_slug_key" ON "system_integrations"("slug");

-- CreateIndex
CREATE INDEX "system_integrations_category_is_active_idx" ON "system_integrations"("category", "is_active");

-- CreateIndex
CREATE INDEX "system_integrations_is_public_is_active_idx" ON "system_integrations"("is_public", "is_active");

-- CreateIndex
CREATE INDEX "system_organization_integrations_organization_id_status_idx" ON "system_organization_integrations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "system_organization_integrations_integration_id_status_idx" ON "system_organization_integrations"("integration_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "system_organization_integrations_organization_id_integratio_key" ON "system_organization_integrations"("organization_id", "integration_id");

-- CreateIndex
CREATE INDEX "system_integration_events_organization_integration_id_event_idx" ON "system_integration_events"("organization_integration_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "system_integration_events_integration_id_event_type_created_idx" ON "system_integration_events"("integration_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "system_integration_events_event_type_created_at_idx" ON "system_integration_events"("event_type", "created_at");

-- AddForeignKey
ALTER TABLE "system_organizations" ADD CONSTRAINT "system_organizations_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "system_subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_organizations" ADD CONSTRAINT "system_organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_subscriptions" ADD CONSTRAINT "system_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_subscriptions" ADD CONSTRAINT "system_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "system_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_organization_members" ADD CONSTRAINT "sales_organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_organization_members" ADD CONSTRAINT "sales_organization_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "system_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_customer_organizations" ADD CONSTRAINT "sales_customer_organizations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "sales_customer_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_customer_organizations" ADD CONSTRAINT "sales_customer_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_products_legacy" ADD CONSTRAINT "sales_products_legacy_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "sales_products_legacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_categories" ADD CONSTRAINT "sales_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_roles" ADD CONSTRAINT "sales_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_users" ADD CONSTRAINT "sales_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_users" ADD CONSTRAINT "sales_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sales_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_products" ADD CONSTRAINT "sales_products_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_products" ADD CONSTRAINT "sales_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "sales_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_products" ADD CONSTRAINT "sales_products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_customers" ADD CONSTRAINT "sales_customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sales" ADD CONSTRAINT "sales_sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "sales_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sales" ADD CONSTRAINT "sales_sales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sales" ADD CONSTRAINT "sales_sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sales_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sale_items" ADD CONSTRAINT "sales_sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "sales_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sale_items" ADD CONSTRAINT "sales_sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "sales_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_items" ADD CONSTRAINT "sales_quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "sales_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_items" ADD CONSTRAINT "sales_quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "sales_quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_expenses" ADD CONSTRAINT "sales_expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_expenses" ADD CONSTRAINT "sales_expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_expenses" ADD CONSTRAINT "sales_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sales_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cash_registers" ADD CONSTRAINT "sales_cash_registers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cash_registers" ADD CONSTRAINT "sales_cash_registers_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cash_registers" ADD CONSTRAINT "sales_cash_registers_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cash_registers" ADD CONSTRAINT "sales_cash_registers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_branches" ADD CONSTRAINT "sales_branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_roles_sas" ADD CONSTRAINT "sales_roles_sas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_roles_sas" ADD CONSTRAINT "sales_roles_sas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_usuarios_sas" ADD CONSTRAINT "sales_usuarios_sas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_usuarios_sas" ADD CONSTRAINT "sales_usuarios_sas_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "sales_roles_sas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_usuarios_sas" ADD CONSTRAINT "sales_usuarios_sas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sales_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sas_sessions" ADD CONSTRAINT "sales_sas_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sas_sessions" ADD CONSTRAINT "sales_sas_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_user_sessions" ADD CONSTRAINT "system_user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_password_changes" ADD CONSTRAINT "system_password_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_usuario_sas_id_fkey" FOREIGN KEY ("usuario_sas_id") REFERENCES "sales_usuarios_sas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_invoices" ADD CONSTRAINT "system_invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_invoices" ADD CONSTRAINT "system_invoices_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "system_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_invoices" ADD CONSTRAINT "system_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "system_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_invoices" ADD CONSTRAINT "system_invoices_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "system_subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_payments" ADD CONSTRAINT "system_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "system_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_payments" ADD CONSTRAINT "system_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "system_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_payment_methods" ADD CONSTRAINT "system_payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_support_tickets" ADD CONSTRAINT "system_support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_support_tickets" ADD CONSTRAINT "system_support_tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_support_tickets" ADD CONSTRAINT "system_support_tickets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ticket_comments" ADD CONSTRAINT "system_ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "system_support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ticket_attachments" ADD CONSTRAINT "system_ticket_attachments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "system_ticket_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ticket_attachments" ADD CONSTRAINT "system_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "system_support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ticket_attachments" ADD CONSTRAINT "system_ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ticket_history" ADD CONSTRAINT "system_ticket_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ticket_history" ADD CONSTRAINT "system_ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "system_support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_white_label_branding" ADD CONSTRAINT "system_white_label_branding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_cms_pages" ADD CONSTRAINT "system_cms_pages_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_cms_pages" ADD CONSTRAINT "system_cms_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_cms_pages" ADD CONSTRAINT "system_cms_pages_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_cms_blog_posts" ADD CONSTRAINT "system_cms_blog_posts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_cms_blog_posts" ADD CONSTRAINT "system_cms_blog_posts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_cms_blog_posts" ADD CONSTRAINT "system_cms_blog_posts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_user_feedback" ADD CONSTRAINT "system_user_feedback_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_feedback_votes" ADD CONSTRAINT "system_feedback_votes_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "system_user_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_versions" ADD CONSTRAINT "system_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_version_notifications" ADD CONSTRAINT "system_version_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_version_notifications" ADD CONSTRAINT "system_version_notifications_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "system_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ab_tests" ADD CONSTRAINT "system_ab_tests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ab_tests" ADD CONSTRAINT "system_ab_tests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ab_test_variants" ADD CONSTRAINT "system_ab_test_variants_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "system_ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ab_test_participants" ADD CONSTRAINT "system_ab_test_participants_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "system_ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ab_test_participants" ADD CONSTRAINT "system_ab_test_participants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "system_ab_test_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_ab_test_events" ADD CONSTRAINT "system_ab_test_events_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "system_ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_custom_domains" ADD CONSTRAINT "system_custom_domains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_custom_domain_dns_records" ADD CONSTRAINT "system_custom_domain_dns_records_custom_domain_id_fkey" FOREIGN KEY ("custom_domain_id") REFERENCES "system_custom_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_integrations" ADD CONSTRAINT "system_integrations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_organization_integrations" ADD CONSTRAINT "system_organization_integrations_installed_by_id_fkey" FOREIGN KEY ("installed_by_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_organization_integrations" ADD CONSTRAINT "system_organization_integrations_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "system_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_organization_integrations" ADD CONSTRAINT "system_organization_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "system_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_integration_events" ADD CONSTRAINT "system_integration_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "system_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_integration_events" ADD CONSTRAINT "system_integration_events_organization_integration_id_fkey" FOREIGN KEY ("organization_integration_id") REFERENCES "system_organization_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

