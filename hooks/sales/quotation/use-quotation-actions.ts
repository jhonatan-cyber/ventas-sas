"use client"

import { useState } from "react"
import { toast } from "sonner"

import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

interface ConvertOptions {
  paymentMethod: string
  notes?: string | null
  items: Array<{
    productId: string
    productName?: string | null
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  discount: number
}

export function useQuotationActions(customerSlug: string, onQuotationsChange?: () => Promise<void> | void) {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotationWithRelations | undefined>()
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [detailQuotation, setDetailQuotation] = useState<SalesQuotationWithRelations | undefined>()
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [convertQuotation, setConvertQuotation] = useState<SalesQuotationWithRelations | undefined>()
  const [isConverting, setIsConverting] = useState(false)

  const openCreateDialog = () => {
    setSelectedQuotation(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (quotation: SalesQuotationWithRelations) => {
    setSelectedQuotation(quotation)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (quotation: SalesQuotationWithRelations) => {
    setSelectedQuotation(quotation)
    setIsDeleteDialogOpen(true)
  }

  const openDetailsDialog = (quotation: SalesQuotationWithRelations) => {
    setDetailQuotation(quotation)
    setIsDetailsDialogOpen(true)
  }

  const openConvertDialog = (quotation: SalesQuotationWithRelations) => {
    setConvertQuotation(quotation)
    setIsConvertDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedQuotation(undefined)
  }

  const closeDetailsDialog = () => {
    setIsDetailsDialogOpen(false)
    setDetailQuotation(undefined)
  }

  const closeConvertDialog = () => {
    setIsConvertDialogOpen(false)
    setConvertQuotation(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedQuotation
        ? `/api/${customerSlug}/cotizaciones/${selectedQuotation.id}`
        : `/api/${customerSlug}/cotizaciones`

      const method = selectedQuotation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar la cotización")
      }

      const message = selectedQuotation ? "Cotización actualizada" : "Cotización creada"
      toast.success(message)
      closeDialogs()

      // Actualizar solo los datos de la tabla sin recargar la página
      if (onQuotationsChange) {
        await Promise.resolve(onQuotationsChange())
      }
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la cotización")
    }
  }

  const handleDelete = async () => {
    if (!selectedQuotation) return

    try {
      const response = await fetch(`/api/${customerSlug}/cotizaciones/${selectedQuotation.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar la cotización")
      }

      toast.success("Cotización eliminada")
      closeDialogs()

      // Actualizar solo los datos de la tabla sin recargar la página
      if (onQuotationsChange) {
        await Promise.resolve(onQuotationsChange())
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la cotización")
    }
  }

  const handleConvert = async ({ paymentMethod, notes, items, discount }: ConvertOptions) => {
    if (!convertQuotation) return

    try {
      setIsConverting(true)

      const response = await fetch(`/api/${customerSlug}/cotizaciones/${convertQuotation.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, notes, items, discount }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        const detail =
          error?.details?.message ||
          error?.message ||
          error?.error ||
          "No se pudo convertir la cotización"
        throw new Error(detail)
      }

      const data = await response.json().catch(() => ({}))
      const saleNumber = data?.sale?.saleNumber ?? data?.sale?.sale_number
      const message = saleNumber
        ? `Venta ${saleNumber} creada correctamente`
        : "Cotización convertida en venta"
      toast.success(message)
      closeConvertDialog()

      // Actualizar solo los datos de la tabla sin recargar la página
      if (onQuotationsChange) {
        await Promise.resolve(onQuotationsChange())
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudo convertir la cotización")
    } finally {
      setIsConverting(false)
    }
  }

  return {
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
    handleConvert,
  }
}

