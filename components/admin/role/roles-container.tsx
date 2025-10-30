"use client"

import { useState } from "react"
import { RolesStats } from "./roles-stats"
import { RolesFilters } from "./roles-filters"
import { RolesTable } from "./roles-table"
import { RolesPagination } from "./roles-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RolesContainerProps {
  roles: RoleWithStats[]
  onEdit?: (role: RoleWithStats) => void
  onToggleStatus?: (roleId: string, currentStatus: boolean) => void
  onDelete?: (roleId: string, roleName: string) => void
}

export function RolesContainer({ roles, onEdit, onToggleStatus, onDelete }: RolesContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar roles por búsqueda y estado
  const filteredRoles = roles.filter(role => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return role.isActive ?? true
    if (statusFilter === "inactive") return !(role.isActive ?? true)
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  // Calcular roles para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentRoles = filteredRoles.slice(startIndex, endIndex)

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

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    const totalPages = Math.ceil(roles.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Estadísticas */}
      <RolesStats roles={roles} />

      {/* Filtros */}
      <RolesFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de roles */}
        <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">
                  Roles ({filteredRoles.length})
                </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredRoles.length === roles.length 
                  ? "Lista completa de roles disponibles en el sistema"
                  : `Mostrando ${filteredRoles.length} de ${roles.length} roles`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <RolesTable roles={currentRoles} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />

        </CardContent>
      </Card>

      {/* Paginación */}
      <RolesPagination
        totalItems={filteredRoles.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

