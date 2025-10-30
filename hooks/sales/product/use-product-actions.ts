"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SalesProduct, Category } from "@prisma/client"

export function useProductActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<(SalesProduct & { category: Category | null }) | undefined>()

  const openCreateDialog = () => {
    setSelectedProduct(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (product: SalesProduct & { category: Category | null }) => {
    setSelectedProduct(product)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (product: SalesProduct & { category: Category | null }) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedProduct(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedProduct
        ? `/api/${customerSlug}/productos/${selectedProduct.id}`
        : `/api/${customerSlug}/productos`

      const method = selectedProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el producto")
      }

      const message = selectedProduct ? "Producto actualizado" : "Producto creado"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el producto")
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/${customerSlug}/productos/${selectedProduct.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el producto")
      }

      toast.success("Producto eliminado")
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el producto")
    }
  }

  const handleToggleStatus = async (product: SalesProduct & { category: Category | null }) => {
    try {
      const newStatus = !product.isActive
      const response = await fetch(`/api/${customerSlug}/productos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado del producto")
      }

      toast.success(newStatus ? "Producto activado" : "Producto desactivado")
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del producto")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedProduct,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

