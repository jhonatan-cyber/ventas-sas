"use client"

import { useState, useEffect, useCallback } from "react"
import { ProductsHeader } from "./products-header"
import { ProductsContainer } from "./products-container"
import { ProductFormDialog } from "./product-form-dialog"
import { ProductDeleteDialog } from "./product-delete-dialog"
import { CategoryCards } from "./category-cards"
import { SalesProduct, Category } from "@prisma/client"
import { useProductActions } from "@/hooks/sales/product/use-product-actions"
import { SalesProductService } from "@/lib/services/sales/sales-product-service"
import { CategoryService } from "@/lib/services/sales/category-service"

interface ProductsPageClientProps {
  initialCategories: Category[]
  customerSlug: string
}

export function ProductsPageClient({ initialCategories, customerSlug }: ProductsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<(SalesProduct & { category: Category | null })[]>([])
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(false)

  const selectedCategoryName = selectedCategory
    ? categories.find((category) => category.id === selectedCategory)?.name
    : undefined

  // Función para cargar productos
  const loadProducts = useCallback(async () => {
    if (!selectedCategory) {
      setProducts([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/${customerSlug}/productos?categoryId=${selectedCategory}&page=1&pageSize=1000`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error al cargar productos:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, customerSlug])

  // Cargar productos cuando se selecciona una categoría
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

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
  } = useProductActions(customerSlug, loadProducts)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <ProductsHeader
        title="Gestión de Productos"
        description="Administra los productos de tu inventario"
        newButtonText="Agregar Producto"
        onNewClick={openCreateDialog}
        showButton={selectedCategory !== null}
        showBackButton={selectedCategory !== null}
        onBackClick={() => setSelectedCategory(null)}
      />

      {selectedCategory ? (
        /* Contenedor con filtros, tabla y paginación */
        <ProductsContainer 
          products={products} 
          categoryName={selectedCategoryName}
          onEdit={openEditDialog}
          onToggleStatus={handleToggleStatus}
          onDelete={openDeleteDialog}
        />
      ) : (
        /* Vista de categorías con cards 3D */
        <CategoryCards 
          categories={categories} 
          onCategorySelect={setSelectedCategory} 
        />
      )}

      {/* Modal de crear/editar producto */}
      <ProductFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        product={selectedProduct}
        categories={categories}
        defaultCategoryId={selectedCategory || undefined}
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

