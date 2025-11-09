"use client"

import { useState } from "react"
import { BranchesTable } from "./branches-table"
import { BranchesFilters } from "./branches-filters"
import { BranchesPagination } from "./branches-pagination"
import { BranchesStats } from "./branches-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Branch } from "@prisma/client"

interface BranchesContainerProps {
  branches: (Branch & {
    organization?: { id: string; razonSocial: string | null; name: string | null; slug: string | null } | null
    _count?: { usuariosSas: number }
  })[]
  onEdit?: (branch: Branch & { organization?: any; _count?: any }) => void
  onToggleStatus?: (branch: Branch & { organization?: any; _count?: any }) => void
  onDelete?: (branch: Branch & { organization?: any; _count?: any }) => void
  onViewDetails?: (branch: Branch & { organization?: any; _count?: any }) => void
}

export function BranchesContainer({ branches, onEdit, onToggleStatus, onDelete, onViewDetails }: BranchesContainerProps) {
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
    <div className="space-y-4 md:space-y-6">
      {/* Estadísticas */}
      <BranchesStats branches={branches} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <BranchesFilters 
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
            statusValue={statusFilter}
          />
        </CardContent>
      </Card>

      {/* Tabla de sucursales sin Card */}
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
          <BranchesTable 
              branches={currentBranches} 
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete}
              onViewDetails={onViewDetails}
            />
      </div>

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

