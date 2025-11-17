"use client"

import { Category } from "@prisma/client"
import { Folder } from "lucide-react"
import { useState } from "react"

import { CategoriesCards } from "./categories-cards"
import { CategoriesFilters } from "./categories-filters"
import { CategoriesPagination } from "./categories-pagination"
import { CategoriesStats } from "./categories-stats"
import { CategoriesTable } from "./categories-table"

import { Card, CardContent } from "@/components/ui/card"

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
    <div className="space-y-4 md:space-y-6">
      {/* Estadísticas */}
      <CategoriesStats categories={categories} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <CategoriesFilters 
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
            statusValue={statusFilter}
          />
        </CardContent>
      </Card>

      {/* Mostrar cards y tabla solo si hay categorías */}
      {currentCategories.length > 0 ? (
        <>
          {/* Cards de categorías (solo móvil) */}
          <CategoriesCards
            categories={currentCategories}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />

          {/* Tabla de categorías (solo desktop) */}
          <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
            <CategoriesTable 
              categories={currentCategories} 
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete} 
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <Folder className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No hay categorías registradas</p>
          </div>
        </div>
      )}

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

