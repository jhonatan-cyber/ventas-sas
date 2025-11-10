export interface SubscriptionWithDetails {
  id: string
  organizationId: string
  planId: string
  status: string
  billingPeriod: string
  startDate: Date
  endDate: Date | null
  autoRenew: boolean
  createdAt: Date
  updatedAt: Date
  organization?: {
    id: string
    name: string
    slug: string
    razonSocial: string | null
    nit: string | null
  } | null
  customer?: {
    id: string
    nombre: string | null
    apellido: string | null
    email: string | null
  } | null
  plan: {
    id: string
    name: string
    priceMonthly: number | null
    priceYearly: number | null
  }
}

