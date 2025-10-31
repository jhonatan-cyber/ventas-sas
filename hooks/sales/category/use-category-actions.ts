"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Category } from "@prisma/client"

export function useCategoryActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState<string>('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()

  const openCreateDialog = () => {
    setSelectedCategory(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setConfirmOpen(false)
    setSelectedCategory(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedCategory
        ? `/api/${customerSlug}/categorias/${selectedCategory.id}`
        : `/api/${customerSlug}/categorias`

      const method = selectedCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar la categoría")
      }

      const message = selectedCategory ? "Categoría actualizada" : "Categoría creada"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la categoría")
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      const response = await fetch(`/api/${customerSlug}/categorias/${selectedCategory.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar la categoría")
      }

      toast.success("Categoría eliminada")
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la categoría")
    }
  }

  const handleToggleStatus = async (category: any) => {
    const newStatus = !category.isActive
    const count = category?._count?.products || 0
    
    // Si está desactivando y no tiene productos asociados, hacer la acción directamente sin confirmación
    if (newStatus === false && count === 0) {
      try {
        const response = await fetch(`/api/${customerSlug}/categorias/${category.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newStatus }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al cambiar el estado de la categoría")
        }

        toast.success(newStatus ? "Categoría activada" : "Categoría desactivada")
        
        startTransition(() => {
          router.refresh()
        })
      } catch (error: any) {
        toast.error(error.message || "Error al cambiar el estado de la categoría")
      }
      return
    }
    
    // Si está desactivando y tiene productos, mostrar confirmación
    if (newStatus === false) {
      setConfirmTitle('Desactivar categoría')
      setConfirmColor('orange')
      setConfirmDesc(`Se desactivará la categoría "${category.name}" y afectará a ${count} producto(s) asociados.`)
      setPendingAction(() => async () => {
        const response = await fetch(`/api/${customerSlug}/categorias/${category.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newStatus }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al cambiar el estado de la categoría")
        }
        toast.success(newStatus ? "Categoría activada" : "Categoría desactivada")
        startTransition(() => router.refresh())
      })
      setConfirmOpen(true)
      return
    }
    
    // Si está activando, hacer la acción directamente
    try {
      const response = await fetch(`/api/${customerSlug}/categorias/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado de la categoría")
      }

      toast.success(newStatus ? "Categoría activada" : "Categoría desactivada")
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado de la categoría")
    }
  }
  
  const confirmPerform = async () => {
    if (!pendingAction) return
    try {
      await pendingAction()
    } catch (error: any) {
      toast.error(error.message || "Acción fallida")
    } finally {
      setConfirmOpen(false)
      setPendingAction(null)
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedCategory,
    confirmOpen,
    confirmTitle,
    confirmDesc,
    confirmColor,
    confirmPerform,
    setConfirmOpen,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

