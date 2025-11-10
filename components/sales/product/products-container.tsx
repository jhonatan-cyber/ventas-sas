"use client"

import { SalesProduct, Category, Branch } from "@prisma/client"
import { useState } from "react"

import { ProductsFilters } from "./products-filters"
import { ProductsGrid } from "./products-grid"
import { ProductsPagination } from "./products-pagination"
import { ProductsStats } from "./products-stats"
import { ProductsTable } from "./products-table"

import { Card, CardContent } from "@/components/ui/card"


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
}

export function ProductsContainer({ 
  products, 
  categoryName, 
  showBranchColumn = false, 
  isAdmin = false,
  branches = [],
  selectedBranchId = null,
  onBranchChange,
  userBranchId = null,
  onEdit, 
  onToggleStatus, 
  onDelete 
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
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
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
          />
        </div>
      ) : (
        <ProductsGrid
          products={currentProducts}
          showBranchColumn={showBranchColumn}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
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

