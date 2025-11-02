"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

export function useQuotationActions(customerSlug: string, onQuotationsChange?: () => Promise<void> | void) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotationWithRelations | undefined>()
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [detailQuotation, setDetailQuotation] = useState<SalesQuotationWithRelations | undefined>()

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

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedQuotation(undefined)
  }

  const closeDetailsDialog = () => {
    setIsDetailsDialogOpen(false)
    setDetailQuotation(undefined)
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

      if (onQuotationsChange) {
        await Promise.resolve(onQuotationsChange())
      }

      startTransition(() => {
        router.refresh()
      })
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

      if (onQuotationsChange) {
        await Promise.resolve(onQuotationsChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la cotización")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailsDialogOpen,
    selectedQuotation,
    detailQuotation,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openDetailsDialog,
    closeDialogs,
    closeDetailsDialog,
    handleSave,
    handleDelete,
  }
}

