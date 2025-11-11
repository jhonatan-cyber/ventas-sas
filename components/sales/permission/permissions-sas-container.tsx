"use client"

import { useState, useMemo } from "react"

import { PermissionsSasFilters } from "./permissions-sas-filters"
import { PermissionsSasPagination } from "./permissions-sas-pagination"
import { PermissionsSasStats } from "./permissions-sas-stats"
import { PermissionsSasTable } from "./permissions-sas-table"

import { Card, CardContent } from "@/components/ui/card"
import { PermissionSasInfo } from "@/lib/services/sales/permission-sas-service"

interface PermissionsSasContainerProps {
  permissions: PermissionSasInfo[]
  onDelete?: (permission: PermissionSasInfo) => void
  onToggleStatus?: (permission: PermissionSasInfo) => void
}

export function PermissionsSasContainer({ permissions: initialPermissions, onDelete, onToggleStatus }: PermissionsSasContainerProps) {
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
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleShowOnlyUnusedChange = (checked: boolean) => {
    setShowOnlyUnused(checked)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
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
    <div className="space-y-4 md:space-y-6">
      {/* Estadísticas */}
      <PermissionsSasStats permissions={initialPermissions} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <PermissionsSasFilters
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
        </CardContent>
      </Card>

      {/* Tabla de permisos sin Card */}
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
        <PermissionsSasTable permissions={currentPermissions} onDelete={onDelete} onToggleStatus={onToggleStatus} />
      </div>

      {/* Paginación */}
      <div className="flex justify-center">
        <PermissionsSasPagination
          totalItems={filteredPermissions.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}

