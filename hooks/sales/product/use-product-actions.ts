"use client"

import { SalesProduct, Category } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { useApiError, extractErrorFromResponse } from "@/hooks/common/use-api-error"

export function useProductActions(customerSlug: string, onProductsChange?: () => void) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const { handleError } = useApiError()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<(SalesProduct & { category: Category | null }) | undefined>()

  const openCreateDialog = () => {
    setSelectedProduct(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = async (product: SalesProduct & { category: Category | null }) => {
    try {
      // Obtener el producto completo desde el API para asegurar que tenemos todos los datos
      const response = await fetch(`/api/${customerSlug}/productos/${product.id}`)
      if (response.ok) {
        const fullProduct = await response.json()
        setSelectedProduct(fullProduct)
      } else {
        // Si falla, usar el producto de la tabla como fallback
        setSelectedProduct(product)
      }
    } catch (error) {
      console.error('Error al cargar producto completo:', error)
      // Si falla, usar el producto de la tabla como fallback
      setSelectedProduct(product)
    }
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (product: SalesProduct & { category: Category | null }) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const openViewDialog = async (product: SalesProduct & { category: Category | null }) => {
    try {
      // Obtener el producto completo desde el API para asegurar que tenemos todos los datos
      const response = await fetch(`/api/${customerSlug}/productos/${product.id}`)
      if (response.ok) {
        const fullProduct = await response.json()
        setSelectedProduct(fullProduct)
      } else {
        // Si falla, usar el producto de la tabla como fallback
        setSelectedProduct(product)
      }
    } catch (error) {
      console.error('Error al cargar producto completo:', error)
      // Si falla, usar el producto de la tabla como fallback
      setSelectedProduct(product)
    }
    setIsDetailDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setIsDetailDialogOpen(false)
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`
        
        // Si hay detalles de validación, mostrarlos
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((err: any) => `${err.field}: ${err.message}`).join(', ')
          throw new Error(`${errorMessage}. ${validationErrors}`)
        }
        
        throw new Error(errorMessage)
      }

      const message = selectedProduct ? "Producto actualizado" : "Producto creado"
      toast.success(message)
      closeDialogs()
      
      // Recargar productos si hay callback
      if (onProductsChange) {
        onProductsChange()
      }
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: selectedProduct ? "Error al actualizar producto" : "Error al crear producto",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/${customerSlug}/productos/${selectedProduct.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      toast.success("Producto eliminado")
      closeDialogs()
      
      // Recargar productos si hay callback
      if (onProductsChange) {
        onProductsChange()
      }
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: "Error al eliminar producto",
      })
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
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      toast.success(newStatus ? "Producto activado" : "Producto desactivado")
      
      // Recargar productos si hay callback
      if (onProductsChange) {
        onProductsChange()
      }
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: "Error al cambiar estado del producto",
      })
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailDialogOpen,
    selectedProduct,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openViewDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

