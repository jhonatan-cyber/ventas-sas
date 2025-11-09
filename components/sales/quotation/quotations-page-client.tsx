"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { QuotationsHeader } from "./quotations-header"
import { QuotationsContainer } from "./quotations-container"
import { QuotationFormDialog } from "./quotation-form-dialog"
import { QuotationDeleteDialog } from "./quotation-delete-dialog"
import { QuotationDetailsDialog } from "./quotation-details-dialog"
import { QuotationConvertDialog } from "./quotation-convert-dialog"
import { useQuotationActions } from "@/hooks/sales/quotation/use-quotation-actions"
import { toast } from "sonner"
import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

interface BranchSummary {
  id: string
  name: string | null
  address?: string | null
}

interface QuotationsPageClientProps {
  initialQuotations: SalesQuotationWithRelations[]
  customerSlug: string
  organizationId: string
  showBranchColumn?: boolean
  canFilterByBranch?: boolean
  initialBranches?: BranchSummary[]
  initialIsAdmin?: boolean
  initialUserBranchId?: string | null
}

export function QuotationsPageClient({
  initialQuotations,
  customerSlug,
  organizationId,
  showBranchColumn = false,
  canFilterByBranch = false,
  initialBranches,
  initialIsAdmin = false,
  initialUserBranchId = null,
}: QuotationsPageClientProps) {
  const initialBranchList = useMemo(() => initialBranches ?? [], [initialBranches])

  const [quotations, setQuotations] = useState<SalesQuotationWithRelations[]>(initialQuotations)
  const [isLoading, setIsLoading] = useState(false)
  const [availableBranches, setAvailableBranches] = useState<BranchSummary[]>(initialBranchList)
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin)
  const [userBranchId, setUserBranchId] = useState<string | null>(initialUserBranchId)

  const normalizeQuotation = useCallback((quotation: any): SalesQuotationWithRelations => ({
    ...quotation,
    customerId: quotation.customerId ?? null,
    branchId: quotation.branchId ?? null,
    subtotal: Number(quotation.subtotal ?? 0),
    discount: Number(quotation.discount ?? 0),
    total: Number(quotation.total ?? 0),
    customerName: quotation.customerName ?? null,
    customer: quotation.customer
      ? {
          id: quotation.customer.id,
          name: quotation.customer.name,
          lastName: quotation.customer.lastName ?? null,
          email: quotation.customer.email ?? null,
          phone: quotation.customer.phone ?? null,
          address: quotation.customer.address ?? null,
          ruc: quotation.customer.ruc ?? null,
        }
      : null,
    customerPhone: quotation.customerPhone ?? null,
    branch: quotation.branch
      ? {
          id: quotation.branch.id,
          name: quotation.branch.name,
          address: quotation.branch.address ?? null,
        }
      : null,
    items: quotation.items?.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      productName: item.productName ?? null,
      product: item.product
        ? {
            ...item.product,
            price: Number(item.product.price ?? 0)
          }
        : undefined,
    })) ?? [],
  }), [])

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/sucursales?page=1&pageSize=1000&status=active`, {
        cache: "no-store",
      })
      if (!response.ok) return
      const data = await response.json()
      const normalized: BranchSummary[] = (data.branches || []).map((branch: any) => ({
        id: branch.id,
        name: branch.name ?? "Sucursal sin nombre",
        address: branch.address ?? null,
      }))
      setAvailableBranches(normalized)
    } catch (error) {
      console.error("Error al cargar sucursales:", error)
    }
  }, [customerSlug])

  const loadQuotations = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/cotizaciones?page=1&pageSize=1000`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudieron cargar las cotizaciones")
      }

      const data = await response.json()
      const normalized = (data.quotations || []).map(normalizeQuotation)
      setQuotations(normalized)
    } catch (error: any) {
      console.error("Error al cargar cotizaciones:", error)
      toast.error(error.message || "Error al cargar las cotizaciones")
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, normalizeQuotation])

  useEffect(() => {
    setAvailableBranches(initialBranchList)
  }, [initialBranchList])

  useEffect(() => {
    setQuotations(initialQuotations.map(normalizeQuotation))
  }, [initialQuotations, normalizeQuotation])

  useEffect(() => {
    setUserBranchId(initialUserBranchId ?? null)
  }, [initialUserBranchId])

  useEffect(() => {
    setIsAdmin(initialIsAdmin)
  }, [initialIsAdmin])

  useEffect(() => {
    if (initialBranchList.length === 0) {
      loadBranches()
    }
  }, [initialBranchList.length, loadBranches])

  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailsDialogOpen,
    isConvertDialogOpen,
    isConverting,
    selectedQuotation,
    detailQuotation,
    convertQuotation,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openDetailsDialog,
    openConvertDialog,
    closeDialogs,
    closeDetailsDialog,
    closeConvertDialog,
    handleSave,
    handleDelete,
    handleConvert
  } = useQuotationActions(customerSlug, async () => {
    await loadQuotations()
    await loadBranches()
  })

  const handleCreateClick = () => {
    openCreateDialog()
  }

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <QuotationsHeader
        title="Gestión de Cotizaciones"
        description="Administra las cotizaciones a tus clientes"
        newButtonText="Agregar Cotización"
        onNewClick={handleCreateClick}
        newButtonDisabled={isLoading}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <QuotationsContainer 
        quotations={quotations as any}
        isLoading={isLoading}
        organizationId={organizationId}
        onEdit={openEditDialog as any}
        onDelete={openDeleteDialog as any}
        onViewDetails={openDetailsDialog as any}
        showBranchColumn={showBranchColumn || isAdmin}
        branches={availableBranches}
        allowBranchFilter={canFilterByBranch}
        onConvert={openConvertDialog}
      />

      {/* Modal de crear/editar cotización */}
      <QuotationFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        quotation={selectedQuotation}
        organizationId={organizationId}
        customerSlug={customerSlug}
        branches={availableBranches}
        isAdmin={isAdmin}
        currentUserBranchId={userBranchId}
        onSave={handleSave}
        isBusy={isLoading}
      />

      {/* Modal de confirmación de eliminar */}
      <QuotationDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        quotation={selectedQuotation}
        onDelete={handleDelete}
      />

      <QuotationDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={closeDetailsDialog}
        quotation={detailQuotation}
        customerSlug={customerSlug}
      />

      <QuotationConvertDialog
        open={isConvertDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeConvertDialog()
          }
        }}
        quotation={convertQuotation}
        onConfirm={handleConvert}
        isSubmitting={isConverting}
        customerSlug={customerSlug}
        isAdmin={isAdmin}
        selectedBranchId={convertQuotation?.branchId ?? null}
        userBranchId={userBranchId}
      />
    </div>
  )
}

