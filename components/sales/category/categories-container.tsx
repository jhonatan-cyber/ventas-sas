"use client"

import { useState } from "react"
import { CategoriesTable } from "./categories-table"
import { CategoriesFilters } from "./categories-filters"
import { CategoriesPagination } from "./categories-pagination"
import { CategoriesStats } from "./categories-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Category } from "@prisma/client"

interface CategoriesContainerProps {
  categories: Category[]
  onEdit?: (category: Category) => void
  onToggleStatus?: (category: Category) => void
  onDelete?: (category: Category) => void
}

export function CategoriesContainer({ categories, onEdit, onToggleStatus, onDelete }: CategoriesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar categorías por búsqueda y estado
  const filteredCategories = categories.filter(category => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        category.name?.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return category.isActive
    if (statusFilter === "inactive") return !category.isActive
    return true // "all" - mostrar todas
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  // Calcular categorías para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCategories = filteredCategories.slice(startIndex, endIndex)

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el filtro
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el tamaño
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <CategoriesStats categories={categories} />

      {/* Filtros */}
      <CategoriesFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de categorías */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Categorías ({filteredCategories.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredCategories.length === categories.length 
                  ? "Lista completa de categorías disponibles"
                  : `Mostrando ${filteredCategories.length} de ${categories.length} categorías`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <CategoriesTable 
              categories={currentCategories} 
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-center">
        <CategoriesPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCategories.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

