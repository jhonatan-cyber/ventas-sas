"use client"

import { CategoriesHeader } from "./categories-header"
import { CategoriesContainer } from "./categories-container"
import { CategoryFormDialog } from "./category-form-dialog"
import { CategoryDeleteDialog } from "./category-delete-dialog"
import { Category } from "@prisma/client"
import { useCategoryActions } from "@/hooks/sales/category/use-category-actions"

interface CategoriesPageClientProps {
  initialCategories: Category[]
  customerSlug: string
}

export function CategoriesPageClient({ initialCategories, customerSlug }: CategoriesPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedCategory,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useCategoryActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <CategoriesHeader
        title="Gestión de Categorías"
        description="Administra las categorías de productos de tu sistema"
        newButtonText="Nueva Categoría"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <CategoriesContainer 
        categories={initialCategories} 
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
    </div>
  )
}

