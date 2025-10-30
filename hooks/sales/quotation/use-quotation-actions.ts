"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Quotation } from "@prisma/client"

export function useQuotationActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | undefined>()

  const openCreateDialog = () => {
    setSelectedQuotation(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedQuotation(undefined)
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
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la cotización")
    }
  }

  const handleStatusChange = async (quotation: Quotation, newStatus: string) => {
    try {
      const response = await fetch(`/api/${customerSlug}/cotizaciones/${quotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado de la cotización")
      }

      const statusLabels: Record<string, string> = {
        pending: "Pendiente",
        approved: "Aprobada",
        rejected: "Rechazada",
        converted: "Convertida",
        expired: "Expirada"
      }

      toast.success(`Cotización ${statusLabels[newStatus] || newStatus}`)
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado de la cotización")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedQuotation,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleStatusChange
  }
}

