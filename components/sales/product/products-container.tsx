"use client"

import { SalesProduct, Category, Branch } from "@prisma/client"
import { Package } from "lucide-react"
import { useState } from "react"

import { ProductsCards } from "./products-cards"
import { ProductsFilters } from "./products-filters"
import { ProductsGrid } from "./products-grid"
import { ProductsPagination } from "./products-pagination"
import { ProductsStats } from "./products-stats"
import { ProductsTable } from "./products-table"

import { Card, CardContent } from "@/components/ui/card"
import { getProductDescription } from "@/lib/utils/product-description"


interface ProductsContainerProps {
  products: (SalesProduct & { category: Category | null; branch: Branch | null })[]
  categoryName?: string
  showBranchColumn?: boolean
  isAdmin?: boolean
  branches?: Branch[]
  selectedBranchId?: string | null
  onBranchChange?: (branchId: string | null) => void
  userBranchId?: string | null
  onEdit?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onToggleStatus?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onDelete?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
  onView?: (product: SalesProduct & { category: Category | null; branch: Branch | null }) => void
}

export function ProductsContainer({ 
  products, 
  categoryName: _categoryName, 
  showBranchColumn = false, 
  isAdmin = false,
  branches = [],
  selectedBranchId = null,
  onBranchChange,
  userBranchId = null,
  onEdit, 
  onToggleStatus, 
  onDelete,
  onView
}: ProductsContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Determinar el branchId a usar para filtrar
  const effectiveBranchId = (() => {
    if (!isAdmin) {
      // Si no es admin, filtrar por su sucursal
      return userBranchId
    }
    // Si es admin, usar la sucursal seleccionada (puede ser null para "todas")
    return selectedBranchId
  })()

  // Filtrar productos por sucursal, búsqueda y estado
  const filteredProducts = products.filter(product => {
    // Filtrar por sucursal
    if (effectiveBranchId !== null && effectiveBranchId !== undefined) {
      if (product.branchId !== effectiveBranchId) return false
    }

    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      // Obtener descripción para búsqueda (usar idioma actual o español por defecto)
      const currentLanguage = (() => {
        try {
          const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
          return prefs?.language || 'es';
        } catch {
          return 'es';
        }
      })();
      const description = getProductDescription(
        product.description,
        (product as any).descriptionTranslations,
        currentLanguage
      ) || "";
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return product.isActive
    if (statusFilter === "inactive") return !product.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular productos para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleBranchChange = (branchId: string | null) => {
    if (onBranchChange) {
      onBranchChange(branchId)
    }
    setCurrentPage(1) // Resetear a la primera página cuando cambia la sucursal
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Estadísticas */}
      <ProductsStats products={filteredProducts} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <ProductsFilters 
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
            statusValue={statusFilter}
            isAdmin={isAdmin}
            branches={branches}
            selectedBranchId={selectedBranchId}
            onBranchChange={handleBranchChange}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      {/* Mostrar cards y tabla/grid solo si hay productos */}
      {currentProducts.length > 0 ? (
        <>
          {/* Cards de productos (solo móvil) */}
          <ProductsCards
            products={currentProducts}
            showBranchColumn={showBranchColumn}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            onView={onView}
          />

          {/* Tabla o Grid de productos (solo desktop) */}
          <div className="hidden md:block">
            {viewMode === "table" ? (
              <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
                <ProductsTable 
                  products={currentProducts.map(p => ({
                    ...p,
                    price: typeof p.price === 'object' && 'toNumber' in p.price ? p.price.toNumber() : Number(p.price),
                    cost: typeof p.cost === 'object' && 'toNumber' in p.cost ? p.cost.toNumber() : Number(p.cost),
                  })) as any} 
                  showBranchColumn={showBranchColumn}
                  onEditClick={onEdit as any} 
                  onToggleStatus={onToggleStatus as any} 
                  onDeleteClick={onDelete as any}
                  onViewClick={onView as any}
                />
              </div>
            ) : (
              <ProductsGrid
                products={currentProducts}
                showBranchColumn={showBranchColumn}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
                onView={onView}
              />
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No hay productos registrados</p>
          </div>
        </div>
      )}

      {/* Paginación */}
      <div className="flex justify-center">
        <ProductsPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProducts.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

