"use client"

import { useState } from "react"
import { ProductsTable } from "./products-table"
import { ProductsFilters } from "./products-filters"
import { ProductsPagination } from "./products-pagination"
import { ProductsStats } from "./products-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesProduct, Category } from "@prisma/client"

interface ProductsContainerProps {
  products: (SalesProduct & { category: Category | null })[]
  onEdit?: (product: SalesProduct & { category: Category | null }) => void
  onToggleStatus?: (product: SalesProduct & { category: Category | null }) => void
  onDelete?: (product: SalesProduct & { category: Category | null }) => void
}

export function ProductsContainer({ products, onEdit, onToggleStatus, onDelete }: ProductsContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar productos por búsqueda y estado
  const filteredProducts = products.filter(product => {
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

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <ProductsStats products={products} />

      {/* Filtros */}
      <ProductsFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de productos */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Productos ({filteredProducts.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredProducts.length === products.length 
                  ? "Lista completa de productos disponibles"
                  : `Mostrando ${filteredProducts.length} de ${products.length} productos`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <ProductsTable 
              products={currentProducts} 
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

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

