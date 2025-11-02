export type NumericCompatible = any

export interface SalesQuotationItem {
  id?: string
  productId: string | null
  productName?: string | null
  quantity: number
  unitPrice: NumericCompatible
  subtotal: NumericCompatible
  product?: {
    id: string
    name: string
    price: NumericCompatible
    imageUrl?: string | null
    brand?: string | null
    model?: string | null
    organizationId?: string | null
    customerId?: string | null
    categoryId?: string | null
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isActive?: boolean
    [key: string]: unknown
  } | null
}

export interface SalesQuotationWithRelations {
  id: string
  organizationId: string
  customerId: string | null
  branchId: string | null
  quotationNumber: string
  status: string
  subtotal: NumericCompatible
  discount: NumericCompatible
  total: NumericCompatible
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  expiresAt?: Date | string | null
  customer?: {
    id: string
    name?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    ruc?: string | null
  } | null
  customerName: string | null
  customerPhone: string | null
  branch?: { id?: string; name?: string | null; address?: string | null } | null
  items?: SalesQuotationItem[]
}



