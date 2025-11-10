"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { SalesHeader } from "./sales-header"
import { SalesContainer } from "./sales-container"
import { SaleFormDialog } from "./sale-form-dialog"
import { SaleDeleteDialog } from "./sale-delete-dialog"
import { SaleDetailsDialog } from "./sale-details-dialog"
import { SaleCancelDialog } from "./sale-cancel-dialog"
import { useSaleActions } from "@/hooks/sales/sale/use-sale-actions"
import { SalesSaleWithRelations } from "./types"
import { toast } from "sonner"

interface SalesPageClientProps {
  initialSales: SalesSaleWithRelations[]
  customerSlug: string
  currentUser?: {
    id: string
    nombre?: string | null
    apellido?: string | null
    email?: string | null
    sucursalId?: string | null
    sucursal?: {
      id?: string | null
      name?: string | null
    } | null
  } | null
}

const normalizeSale = (sale: any): SalesSaleWithRelations => ({
  id: sale.id,
  organizationId: sale.organizationId,
  userId: sale.userId,
  customerId: sale.customerId ?? null,
  customerName: sale.customerName ?? null,
  saleNumber: sale.saleNumber,
  status: sale.status,
  subtotal: Number(sale.subtotal ?? 0),
  discount: Number(sale.discount ?? 0),
  total: Number(sale.total ?? 0),
  paymentMethod: sale.paymentMethod,
  notes: sale.notes ?? null,
  createdAt: sale.createdAt ?? null,
  updatedAt: sale.updatedAt ?? null,
  customer: sale.customer
    ? {
        id: sale.customer.id,
        name: sale.customer.name ?? null,
        lastName: sale.customer.lastName ?? null,
        email: sale.customer.email ?? null,
        phone: sale.customer.phone ?? null,
      }
    : null,
  user: sale.user
    ? {
        id: sale.user.id,
        fullName: sale.user.fullName ?? null,
        email: sale.user.email ?? null,
      }
    : null,
  items: (sale.items || []).map((item: any) => ({
    id: item.id,
    productId: item.productId,
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    subtotal: Number(item.subtotal ?? 0),
    trackingCodes: Array.isArray(item.trackingCodes)
      ? item.trackingCodes.filter((code: any) => typeof code === 'string').map((code: string) => code.trim())
      : [],
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price ?? 0),
          imageUrl: item.product.imageUrl ?? null,
        }
      : null,
  })),
})

export function SalesPageClient({ initialSales, customerSlug, currentUser = null }: SalesPageClientProps) {
  const [sales, setSales] = useState<SalesSaleWithRelations[]>(() => initialSales.map(normalizeSale))
  const [isLoading, setIsLoading] = useState(false)
  const [detailSale, setDetailSale] = useState<SalesSaleWithRelations | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [cancelSale, setCancelSale] = useState<SalesSaleWithRelations | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  useEffect(() => {
    setSales(initialSales.map(normalizeSale))
  }, [initialSales])

  const loadSales = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/ventas?page=1&pageSize=1000`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudieron cargar las ventas")
      }

      const data = await response.json()
      const normalized = (data.sales || []).map(normalizeSale)
      setSales(normalized)
    } catch (error: any) {
      console.error("Error al cargar ventas:", error)
      toast.error(error.message || "Error al cargar las ventas")
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug])

  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedSale,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
  } = useSaleActions(customerSlug, loadSales)

  const handleCreateClick = () => {
    openCreateDialog()
  }

  const openDetailsDialog = (sale: SalesSaleWithRelations) => {
    setDetailSale(sale)
    setIsDetailsDialogOpen(true)
  }

  const closeDetailsDialog = () => {
    setIsDetailsDialogOpen(false)
    setDetailSale(null)
  }

  const openCancelDialog = (sale: SalesSaleWithRelations) => {
    setCancelSale(sale)
    setIsCancelDialogOpen(true)
  }

  const closeCancelDialog = () => {
    setIsCancelDialogOpen(false)
    setCancelSale(null)
  }

  const handleCancelSale = async () => {
    if (!cancelSale) return
    
    try {
      const response = await fetch(`/api/${customerSlug}/ventas/${cancelSale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: 'cancelled'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al anular la venta")
      }

      toast.success("Venta anulada correctamente")
      closeCancelDialog()

      // Recargar ventas
      await loadSales()
    } catch (error: any) {
      toast.error(error.message || "Error al anular la venta")
    }
  }

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bDate - aDate
    })
  }, [sales])

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      <SalesHeader
        title="Gestión de Ventas"
        description="Registra y supervisa las ventas realizadas"
        newButtonText="Nueva Venta"
        onNewClick={handleCreateClick}
      />

      <SalesContainer
        sales={sortedSales}
        isLoading={isLoading}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onViewDetails={openDetailsDialog}
        onCancel={openCancelDialog}
      />

      <SaleFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        sale={selectedSale}
        customerSlug={customerSlug}
        currentUser={currentUser}
        onSave={handleSave}
      />

      <SaleDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        sale={selectedSale}
        onDelete={handleDelete}
      />

      <SaleDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog()
          } else {
            setIsDetailsDialogOpen(true)
          }
        }}
        sale={detailSale}
        customerSlug={customerSlug}
      />

      <SaleCancelDialog
        open={isCancelDialogOpen}
        onOpenChange={closeCancelDialog}
        sale={cancelSale}
        onCancel={handleCancelSale}
      />
    </div>
  )
}
