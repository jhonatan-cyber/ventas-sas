"use client"

import { Category } from "@prisma/client"
import { useState, useEffect } from "react"

import { CategoriesContainer } from "./categories-container"
import { CategoriesHeader } from "./categories-header"
import { CategoryDeleteDialog } from "./category-delete-dialog"
import { CategoryFormDialog } from "./category-form-dialog"

import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog"
import { useCategoryActions } from "@/hooks/sales/category/use-category-actions"
import { useSasPermissions } from "@/contexts/sas-permissions-context"

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

  // Permisos SAS: controlar visibilidad de acciones
  const { hasPermission } = useSasPermissions()
  const canCreate = hasPermission('categorias_crear')
  const canEdit = hasPermission('categorias_editar')
  const canDelete = hasPermission('categorias_eliminar')
  const canToggle = hasPermission('categorias_activar') || hasPermission('categorias_desactivar')

  // Actualizar categorías cuando cambien los initialCategories (después de router.refresh)
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <CategoriesHeader
        title="Gestión de Categorías"
        description="Administra las categorías de productos"
        newButtonText="Agregar Categoría"
        onNewClick={canCreate ? openCreateDialog : undefined}
        showNew={canCreate}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <CategoriesContainer 
        categories={categories} 
        onEdit={canEdit ? openEditDialog : undefined}
        onToggleStatus={canToggle ? handleToggleStatus : undefined}
        onDelete={canDelete ? openDeleteDialog : undefined}
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

