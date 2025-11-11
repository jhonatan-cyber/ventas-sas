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
  maxProducts?: number | null
  totalProducts?: number
}

export function ProductsPageClient({ initialCategories, customerSlug, maxProducts, totalProducts = 0 }: ProductsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<(SalesProduct & { category: Category | null; branch: Branch | null })[]>([])
  const [categories] = useState<Category[]>(initialCategories)
  const [showBranchColumn, setShowBranchColumn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)
  // Estado para mantener el conteo total de productos (se actualiza cuando se crea/elimina)
  const [currentTotalProducts, setCurrentTotalProducts] = useState(totalProducts)

  // Actualizar el conteo cuando cambie totalProducts desde el servidor
  useEffect(() => {
    setCurrentTotalProducts(totalProducts)
  }, [totalProducts])

  const selectedCategoryName = selectedCategory
    ? categories.find((category) => category.id === selectedCategory)?.name
    : undefined

  // Función para cargar productos
  const loadProducts = useCallback(async () => {
    if (!selectedCategory) {
      setProducts([])
      return
    }

    try {
      const response = await fetch(`/api/${customerSlug}/productos?categoryId=${selectedCategory}&page=1&pageSize=1000`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error al cargar productos:', error)
      setProducts([])
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

  // Función para actualizar el conteo total cuando se crea/elimina un producto
  const updateTotalProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/productos?page=1&pageSize=1`)
      if (response.ok) {
        const data = await response.json()
        setCurrentTotalProducts(data.total || 0)
      }
    } catch (error) {
      console.error('Error al actualizar conteo de productos:', error)
    }
  }, [customerSlug])


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
  } = useProductActions(customerSlug, async () => {
    await loadProducts()
    await updateTotalProducts()
  })

  // Calcular si se alcanzó el límite de productos
  // maxProducts puede ser null (sin límite o plan no asignado) o un número
  // Si maxProducts es null, no hay límite, así que siempre mostramos el botón
  const hasReachedLimit = maxProducts !== null && 
                          maxProducts !== undefined && 
                          typeof maxProducts === 'number' && 
                          maxProducts > 0 && 
                          currentTotalProducts >= maxProducts

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <ProductsHeader
        title="Gestión de Productos"
        description="Administra los productos de tu inventario"
        newButtonText="Agregar Producto"
        onNewClick={openCreateDialog}
        showButton={selectedCategory !== null && !hasReachedLimit}
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

