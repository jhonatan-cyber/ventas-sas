"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { SalesSaleWithRelations } from "@/components/sales/sale/types"
import { extractErrorFromResponse } from "@/hooks/common/use-api-error"

interface UseSaleActionsReturn {
  isFormDialogOpen: boolean
  isDeleteDialogOpen: boolean
  selectedSale?: SalesSaleWithRelations
  openCreateDialog: () => void
  openEditDialog: (sale: SalesSaleWithRelations) => void
  openDeleteDialog: (sale: SalesSaleWithRelations) => void
  closeDialogs: () => void
  handleSave: (data: any) => Promise<void>
  handleDelete: () => Promise<void>
}

export function useSaleActions(customerSlug: string, onSalesChange?: () => Promise<void> | void): UseSaleActionsReturn {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SalesSaleWithRelations | undefined>()

  const openCreateDialog = () => {
    setSelectedSale(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (sale: SalesSaleWithRelations) => {
    setSelectedSale(sale)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (sale: SalesSaleWithRelations) => {
    setSelectedSale(sale)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedSale(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedSale
        ? `/api/${customerSlug}/ventas/${selectedSale.id}`
        : `/api/${customerSlug}/ventas`

      const method = selectedSale ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      toast.success(selectedSale ? "Venta actualizada" : "Venta registrada")
      closeDialogs()

      if (onSalesChange) {
        await Promise.resolve(onSalesChange())
      }

      startTransition(() => {
        router.refresh()
      })

      // Retornar la venta creada
      try {
        return await response.json()
      } catch  {
        // Si no hay JSON en la respuesta, retornar undefined
        return undefined
      }
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la venta")
      throw error
    }
  }

  const handleDelete = async () => {
    if (!selectedSale) return

    try {
      const response = await fetch(`/api/${customerSlug}/ventas/${selectedSale.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      toast.success("Venta eliminada")
      closeDialogs()

      if (onSalesChange) {
        await Promise.resolve(onSalesChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la venta")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedSale,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
  }
}
