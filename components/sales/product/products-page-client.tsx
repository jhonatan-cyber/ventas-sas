"use client"

import { SalesProduct, Category, Branch } from "@prisma/client"
import { useState, useEffect, useCallback } from "react"

import { CategoryCards } from "./category-cards"
import { ProductDeleteDialog } from "./product-delete-dialog"
import { ProductFormDialog } from "./product-form-dialog"
import { ProductsContainer } from "./products-container"
import { ProductsHeader } from "./products-header"

import { useProductActions } from "@/hooks/sales/product/use-product-actions"

interface ProductsPageClientProps {
  initialCategories: Category[]
  customerSlug: string
}

export function ProductsPageClient({ initialCategories, customerSlug }: ProductsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<(SalesProduct & { category: Category | null; branch: Branch | null })[]>([])
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(false)
  const [showBranchColumn, setShowBranchColumn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)

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

  // Obtener información del usuario y sucursales
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userResponse = await fetch(`/api/${customerSlug}/auth/me`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          const userRoleName = userData.rol?.nombre?.toLowerCase() || ""
          const isUserAdmin = userRoleName.includes("administrador") || userRoleName === "admin"
          setIsAdmin(isUserAdmin)
          setShowBranchColumn(isUserAdmin)
          setUserBranchId(userData.sucursalId || null)

          // Si es administrador, cargar sucursales activas
          if (isUserAdmin) {
            try {
              const branchesResponse = await fetch(`/api/${customerSlug}/sucursales?status=active&page=1&pageSize=1000`)
              if (branchesResponse.ok) {
                const branchesData = await branchesResponse.json()
                setBranches(branchesData.branches || [])
              }
            } catch (error) {
              console.error("Error al cargar sucursales:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error)
      }
    }
    fetchUserInfo()
  }, [customerSlug])

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
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
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
          showBranchColumn={showBranchColumn}
          isAdmin={isAdmin}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          userBranchId={userBranchId}
          onEdit={openEditDialog}
          onToggleStatus={handleToggleStatus}
          onDelete={openDeleteDialog}
        />
      ) : (
        /* Vista de categorías con cards mejorados */
        <CategoryCards 
          categories={categories} 
          onCategorySelect={setSelectedCategory}
          customerSlug={customerSlug}
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

