"use client"

import { Shield } from "lucide-react"
import { useState, useMemo } from "react"

import { PermissionsSasCards } from "./permissions-sas-cards"
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
    <div className="space-y-4 md:space-y-6 overflow-x-hidden max-w-full">
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

      {/* Mostrar cards y tabla solo si hay permisos */}
      {currentPermissions.length > 0 ? (
        <>
          {/* Cards de permisos (solo móvil) */}
          <PermissionsSasCards
            permissions={currentPermissions}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />

          {/* Tabla de permisos (solo desktop) */}
          <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden overflow-x-auto">
            <PermissionsSasTable permissions={currentPermissions} onDelete={onDelete} onToggleStatus={onToggleStatus} />
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No se encontraron permisos con los filtros aplicados</p>
          </div>
        </div>
      )}

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

