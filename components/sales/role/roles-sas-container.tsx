"use client"

import { RoleSas } from "@prisma/client"
import { useState } from "react"

import { RolesSasFilters } from "./roles-sas-filters"
import { RolesSasPagination } from "./roles-sas-pagination"
import { RolesSasStats } from "./roles-sas-stats"
import { RolesSasTable } from "./roles-sas-table"

import { Card, CardContent } from "@/components/ui/card"

interface RolesSasContainerProps {
  roles: (RoleSas & {
    organization?: { razonSocial: string | null; name: string | null; slug: string | null } | null
    sucursal: { name: string } | null
    _count?: { usuariosSas: number }
  })[]
  onEdit?: (role: RoleSas & { organization?: any; sucursal: any }) => void
  onToggleStatus?: (role: RoleSas & { organization?: any; sucursal: any }) => void
  onDelete?: (role: RoleSas & { organization?: any; sucursal: any }) => void
}

export function RolesSasContainer({ roles, onEdit, onToggleStatus, onDelete }: RolesSasContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar roles por búsqueda y estado
  const filteredRoles = roles.filter(role => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        role.nombre?.toLowerCase().includes(searchLower) ||
        role.descripcion?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return role.isActive
    if (statusFilter === "inactive") return !role.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular roles para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentRoles = filteredRoles.slice(startIndex, endIndex)

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
      <RolesSasStats roles={roles} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <RolesSasFilters 
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
            statusValue={statusFilter}
          />
        </CardContent>
      </Card>

      {/* Tabla de roles sin Card */}
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
        <RolesSasTable 
          roles={currentRoles} 
          onEditClick={onEdit} 
          onToggleStatus={onToggleStatus} 
          onDeleteClick={onDelete} 
        />
      </div>

      {/* Paginación */}
      <div className="flex justify-center">
        <RolesSasPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRoles.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

