"use client"

import { Category } from "@prisma/client"
import { useState, useEffect } from "react"

import { CategoriesContainer } from "./categories-container"
import { CategoriesHeader } from "./categories-header"
import { CategoryDeleteDialog } from "./category-delete-dialog"
import { CategoryFormDialog } from "./category-form-dialog"

import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog"
import { useCategoryActions } from "@/hooks/sales/category/use-category-actions"

interface CategoriesPageClientProps {
  initialCategories: (Category & {
    _count?: { products: number }
  })[]
  customerSlug: string
}

export function CategoriesPageClient({ initialCategories, customerSlug }: CategoriesPageClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  
  const {
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
  } = useCategoryActions(customerSlug, setCategories)

  // Actualizar categorías cuando cambien los initialCategories (después de router.refresh)
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <CategoriesHeader
        title="Gestión de Categorías"
        description="Administra las categorías de productos de tu sistema"
        newButtonText="Agregar Categoría"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <CategoriesContainer 
        categories={categories} 
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar categoría */}
      <CategoryFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        category={selectedCategory}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <CategoryDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        category={selectedCategory}
        onDelete={handleDelete}
      />

      {/* Modal de confirmación para acciones */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        confirmText="Confirmar"
        confirmColor={confirmColor}
        onConfirm={confirmPerform}
      />
    </div>
  )
}

