"use client"

import { ProductsHeader } from "./products-header"
import { ProductsContainer } from "./products-container"
import { ProductFormDialog } from "./product-form-dialog"
import { ProductDeleteDialog } from "./product-delete-dialog"
import { SalesProduct, Category } from "@prisma/client"
import { useProductActions } from "@/hooks/sales/product/use-product-actions"

interface ProductsPageClientProps {
  initialProducts: (SalesProduct & { category: Category | null })[]
  categories: Category[]
  customerSlug: string
}

export function ProductsPageClient({ initialProducts, categories, customerSlug }: ProductsPageClientProps) {
  const {
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
  } = useProductActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <ProductsHeader
        title="Gestión de Productos"
        description="Administra los productos de tu inventario"
        newButtonText="Nuevo Producto"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <ProductsContainer 
        products={initialProducts} 
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar producto */}
      <ProductFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        product={selectedProduct}
        categories={categories}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <ProductDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        product={selectedProduct}
        onDelete={handleDelete}
      />
    </div>
  )
}

