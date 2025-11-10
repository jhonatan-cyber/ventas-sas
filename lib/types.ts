import type {
  Customer as PrismaCustomer,
  Product,
  Order,
  OrderItem,
  SubscriptionPlan,
  Organization,
  Role,
  OrganizationMember,
  Profile
} from '@prisma/client'

export type Customer = PrismaCustomer & {
  primaryOrganization?: Pick<Organization, 'id' | 'name' | 'slug' | 'razonSocial' | 'nit' | 'subscriptionStatus'> | null
  razonSocial?: string | null
  slug?: string | null
  nit?: string | null
  organizationId?: string | null
}

export type {
  Product,
  Order,
  OrderItem,
  SubscriptionPlan,
  Organization,
  Role,
  OrganizationMember,
  Profile
}

// Additional types for the application
export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
}

export interface OrderStats {
  total: number
  totalRevenue: number
  pending: number
  completed: number
}

export interface ProductStats {
  total: number
  lowStock: number
  categories: number
}

export interface CustomerStats {
  total: number
  recent: number
}

export interface UserStats {
  totalUsers: number
  superAdmins: number
  organizations: number
}

// Form types
export interface CustomerFormData {
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  country?: string
}

export interface ProductFormData {
  name: string
  description?: string
  price: number
  stock: number
  sku?: string
  category?: string
  imageUrl?: string
}

export interface OrderFormData {
  customerId: string
  orderNumber: string
  status: string
  total: number
  notes?: string
  orderItems: {
    productId: string
    quantity: number
    unitPrice: number
    subtotal: number
  }[]
}
