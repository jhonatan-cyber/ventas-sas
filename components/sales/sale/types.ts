export interface SaleCustomerSummary {
  id: string
  name?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
}

export interface SaleUserSummary {
  id: string
  fullName?: string | null
  email?: string | null
}

export interface SaleProductSummary {
  id: string
  name: string
  price: number
  imageUrl?: string | null
}

export interface SaleItemWithProduct {
  id?: string
  productId: string
  quantity: number
  unitPrice: number
  subtotal: number
  product?: SaleProductSummary | null
  trackingCodes?: string[] | null
}

export interface SalesSaleWithRelations {
  id: string
  organizationId: string
  userId: string
  customerId: string | null
  customerName?: string | null
  saleNumber: string
  status: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  notes?: string | null
  createdAt: string | null
  updatedAt: string | null
  customer?: SaleCustomerSummary | null
  user?: SaleUserSummary | null
  items: SaleItemWithProduct[]
}
