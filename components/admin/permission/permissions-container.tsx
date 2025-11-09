"use client"

import { useState, useMemo } from "react"
import { PermissionsTable } from "./permissions-table"
import { PermissionsFilters } from "./permissions-filters"
import { PermissionsPagination } from "./permissions-pagination"
import { PermissionInfo } from "@/lib/services/admin/permission-admin-service"

interface PermissionsContainerProps {
  permissions: PermissionInfo[]
  onDelete?: (permission: PermissionInfo) => void
  onToggleStatus?: (permission: PermissionInfo) => void
}

export function PermissionsContainer({ permissions: initialPermissions, onDelete, onToggleStatus }: PermissionsContainerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showOnlyUnused, setShowOnlyUnused] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Filtrar permisos
  const filteredPermissions = useMemo(() => {
    let filtered = initialPermissions

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        perm =>
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(perm => perm.category === selectedCategory)
    }

    // Filtrar solo no usados
    if (showOnlyUnused) {
      filtered = filtered.filter(perm => perm.roleCount === 0)
    }

    return filtered
  }, [initialPermissions, searchTerm, selectedCategory, showOnlyUnused])

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(initialPermissions.map(p => p.category))
    return Array.from(cats).sort()
  }, [initialPermissions])

  // Calcular permisos para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPermissions = filteredPermissions.slice(startIndex, endIndex)

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la categoría
  }

  const handleShowOnlyUnusedChange = (checked: boolean) => {
    setShowOnlyUnused(checked)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el filtro
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el tamaño
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    const totalPages = Math.ceil(filteredPermissions.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-4">
      <PermissionsFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        showOnlyUnused={showOnlyUnused}
        setShowOnlyUnused={handleShowOnlyUnusedChange}
        categories={categories}
        pageSize={pageSize.toString()}
        onPageSizeChange={handlePageSizeChange}
      />

      <PermissionsTable permissions={currentPermissions} onDelete={onDelete} onToggleStatus={onToggleStatus} />

      {/* Paginación centrada */}
      <PermissionsPagination
        totalItems={filteredPermissions.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

