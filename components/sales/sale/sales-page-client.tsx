"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { SaleCancelDialog } from "./sale-cancel-dialog"
import { SaleDeleteDialog } from "./sale-delete-dialog"
import { SaleDetailsDialog } from "./sale-details-dialog"
import { SaleFormDialog } from "./sale-form-dialog"
import { SalesContainer } from "./sales-container"
import { SalesHeader } from "./sales-header"
import { SalesSaleWithRelations } from "./types"

import { useSaleActions } from "@/hooks/sales/sale/use-sale-actions"
import { useSasPermissions } from "@/hooks/sales/use-sas-permissions"


interface SalesBranchSummary {
  id: string
  name: string | null
}

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
  branches?: SalesBranchSummary[]
  maxBranches?: number
  hasOpenCashRegister?: boolean
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

export function SalesPageClient({ initialSales, customerSlug, currentUser = null, branches = [], maxBranches, hasOpenCashRegister = false }: SalesPageClientProps) {
  // Hook para verificar permisos del usuario
  const { hasPermission } = useSasPermissions()
  
  const [sales, setSales] = useState<SalesSaleWithRelations[]>(() => initialSales.map(normalizeSale))
  const [isLoading, setIsLoading] = useState(false)
  const [detailSale, setDetailSale] = useState<SalesSaleWithRelations | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [cancelSale, setCancelSale] = useState<SalesSaleWithRelations | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [hasOpenCashRegisterState, setHasOpenCashRegisterState] = useState(hasOpenCashRegister)

  useEffect(() => {
    setSales(initialSales.map(normalizeSale))
  }, [initialSales])

  // Función para verificar si hay cajas abiertas
  const checkOpenCashRegisters = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/cajas?page=1&pageSize=1&isOpen=true`)
      if (response.ok) {
        const data = await response.json()
        const hasOpen = (data.total || 0) > 0
        setHasOpenCashRegisterState(hasOpen)
      }
    } catch (error) {
      console.error("Error al verificar cajas abiertas:", error)
      // No mostrar error al usuario, solo en consola
    }
  }, [customerSlug])

  // Verificar cajas abiertas al montar el componente y configurar intervalo
  useEffect(() => {
    // Verificar inmediatamente
    checkOpenCashRegisters()
    
    // Configurar intervalo para verificar cada 30 segundos (reducido de 5 segundos)
    const interval = setInterval(() => {
      checkOpenCashRegisters()
    }, 30000) // Verificar cada 30 segundos para reducir carga

    return () => clearInterval(interval)
  }, [customerSlug, checkOpenCashRegisters]) // Incluir checkOpenCashRegisters como dependencia

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
    handleSave: originalHandleSave,
    handleDelete,
  } = useSaleActions(customerSlug, loadSales)

  // Wrapper para handleSave que también verifica cajas abiertas
  const handleSave = useCallback(async (data: any) => {
    await originalHandleSave(data)
    // Verificar cajas abiertas después de guardar (por si se cerró una caja)
    await checkOpenCashRegisters()
  }, [originalHandleSave, checkOpenCashRegisters])

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

  // Verificar permisos para mostrar botones de acciones
  const canCreateSale = hasPermission('ventas_crear')
  const canEditSale = hasPermission('ventas_editar')
  const canDeleteSale = hasPermission('ventas_eliminar')
  const canCancelSale = hasPermission('ventas_anular')

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      <SalesHeader
        title="Ventas"
        description="Gestiona las ventas de tu negocio"
        newButtonText="Nueva venta"
        onNewClick={canCreateSale ? handleCreateClick : undefined}
        disabled={!hasOpenCashRegisterState || !canCreateSale}
        showNewButton={canCreateSale}
      />

      <SalesContainer
        sales={sortedSales}
        isLoading={isLoading}
        onEdit={canEditSale ? openEditDialog : undefined}
        onDelete={canDeleteSale ? openDeleteDialog : undefined}
        onViewDetails={openDetailsDialog}
        onCancel={canCancelSale ? openCancelDialog : undefined}
        branches={branches}
        maxBranches={maxBranches}
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
        customerSlug={customerSlug}
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
        maxBranches={maxBranches}
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
