"use client"

import { Category } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type CategoryWithRelations = Category & {
  _count?: { products: number }
}

export function useCategoryActions(
  customerSlug: string,
  setCategories?: (categories: CategoryWithRelations[] | ((prev: CategoryWithRelations[]) => CategoryWithRelations[])) => void
) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState<string>('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithRelations | undefined>()

  const openCreateDialog = () => {
    setSelectedCategory(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (category: CategoryWithRelations) => {
    setSelectedCategory(category)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (category: CategoryWithRelations) => {
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

      const savedCategory = await response.json()
      const message = selectedCategory ? "Categoría actualizada" : "Categoría creada"
      toast.success(message)
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setCategories) {
        if (selectedCategory) {
          // Actualizar categoría existente manteniendo su posición
          setCategories((prevCategories) =>
            prevCategories.map((category) =>
              category.id === selectedCategory.id ? { ...category, ...savedCategory } : category
            )
          )
        } else {
          // Agregar nueva categoría al principio (ordenado por createdAt desc)
          setCategories((prevCategories) => [savedCategory, ...prevCategories])
        }
      } else {
        // Fallback a router.refresh si no hay setCategories
        startTransition(() => {
          router.refresh()
        })
      }
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
      
      // Actualizar estado local en tiempo real
      if (setCategories) {
        setCategories((prevCategories) => prevCategories.filter((category) => category.id !== selectedCategory.id))
      } else {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la categoría")
    }
  }

  const handleToggleStatus = async (category: CategoryWithRelations) => {
    const newStatus = !category.isActive
    const count = category?._count?.products || 0
    
    // Función para actualizar el estado de la categoría
    const updateCategoryStatus = async () => {
      const response = await fetch(`/api/${customerSlug}/categorias/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado de la categoría")
      }
      const updatedCategory = await response.json()
      
      // Actualizar estado local en tiempo real
      if (setCategories) {
        setCategories((prevCategories) =>
          prevCategories.map((c) =>
            c.id === category.id ? { ...c, isActive: newStatus, ...updatedCategory } : c
          )
        )
      }
      
      toast.success(newStatus ? "Categoría activada" : "Categoría desactivada")
    }
    
    // Si no tiene productos asociados, hacer la acción directamente sin confirmación
    if (count === 0) {
      try {
        await updateCategoryStatus()
      } catch (error: any) {
        toast.error(error.message || "Error al cambiar el estado de la categoría")
      }
      return
    }
    
    // Si tiene productos, mostrar confirmación
    setConfirmTitle(newStatus ? 'Activar categoría' : 'Desactivar categoría')
    setConfirmColor(newStatus ? 'green' : 'orange')
    setConfirmDesc(`Se ${newStatus ? 'activará' : 'desactivará'} la categoría "${category.name}" y afectará a ${count} producto(s) asociados.`)
    setPendingAction(() => updateCategoryStatus)
    setConfirmOpen(true)
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

