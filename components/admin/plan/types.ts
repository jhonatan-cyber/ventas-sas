import { SubscriptionPlanWithStats } from "@/lib/services/admin/subscription-admin-service"

// Tipo para planes con price serializado (número en lugar de Decimal)
export interface SerializedSubscriptionPlanWithStats extends Omit<SubscriptionPlanWithStats, 'priceMonthly' | 'priceYearly' | 'modules'> {
  hasMonthly: boolean
  hasYearly: boolean
  priceMonthly: number | null
  priceYearly: number | null
  modules: string[] // Array de IDs de módulos
}
