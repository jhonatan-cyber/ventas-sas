-- Add contact info fields to support tickets for SAS support module
ALTER TABLE "system_support_tickets"
  ADD COLUMN "contact_name" TEXT,
  ADD COLUMN "contact_email" TEXT,
  ADD COLUMN "contact_phone" TEXT;

