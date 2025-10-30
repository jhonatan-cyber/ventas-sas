"use client"

import { useState } from "react"
import { BranchesTable } from "./branches-table"
import { BranchesFilters } from "./branches-filters"
import { BranchesPagination } from "./branches-pagination"
import { BranchesStats } from "./branches-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Branch } from "@prisma/client"

interface BranchesContainerProps {
  branches: Branch[]
  onEdit?: (branch: Branch) => void
  onToggleStatus?: (branch: Branch) => void
  onDelete?: (branch: Branch) => void
}

export function BranchesContainer({ branches, onEdit, onToggleStatus, onDelete }: BranchesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar sucursales por búsqueda y estado
  const filteredBranches = branches.filter(branch => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        branch.name?.toLowerCase().includes(searchLower) ||
        branch.email?.toLowerCase().includes(searchLower) ||
        branch.phone?.toLowerCase().includes(searchLower) ||
        branch.address?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return branch.isActive
    if (statusFilter === "inactive") return !branch.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular sucursales para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentBranches = filteredBranches.slice(startIndex, endIndex)

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
      <BranchesStats branches={branches} />

      {/* Filtros */}
      <BranchesFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de sucursales */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Sucursales ({filteredBranches.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredBranches.length === branches.length 
                  ? "Lista completa de sucursales disponibles"
                  : `Mostrando ${filteredBranches.length} de ${branches.length} sucursales`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <BranchesTable 
              branches={currentBranches} 
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-center">
        <BranchesPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredBranches.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

