/*
  Warnings:

  - You are about to drop the column `max_orders` on the `system_subscription_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "system_subscription_plans" DROP COLUMN "max_orders",
ADD COLUMN     "max_branches" INTEGER;
