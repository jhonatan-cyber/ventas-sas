"use client"

import { useState } from "react"
import { Shield } from "lucide-react"
import { RolesStats } from "./roles-stats"
import { RolesFilters } from "./roles-filters"
import { RolesTable } from "./roles-table"
import { RolesCards } from "./roles-cards"
import { RolesPagination } from "./roles-pagination"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RolesContainerProps {
  roles: RoleWithStats[]
  onEdit?: (role: RoleWithStats) => void
  onView?: (role: RoleWithStats) => void
  onToggleStatus?: (roleId: string, roleName: string, currentStatus: boolean, userCount: number) => void
  onDelete?: (roleId: string, roleName: string) => void
  onManagePermissions?: (role: RoleWithStats) => void
}

export function RolesContainer({ roles, onEdit, onView, onToggleStatus, onDelete, onManagePermissions }: RolesContainerProps) {
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
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 p-0 md:px-6">
      {/* Estadísticas */}
      <RolesStats roles={roles} />

      {/* Filtros */}
      <RolesFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Mostrar tabla y cards solo si hay roles */}
      {roles.length > 0 ? (
        <>
          {/* Cards de roles (solo móvil) */}
          <RolesCards roles={currentRoles} onEdit={onEdit} onView={onView} onToggleStatus={onToggleStatus} onDelete={onDelete} onManagePermissions={onManagePermissions} />

          {/* Tabla de roles (solo desktop) */}
          <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <RolesTable roles={currentRoles} onEdit={onEdit} onView={onView} onToggleStatus={onToggleStatus} onDelete={onDelete} onManagePermissions={onManagePermissions} />
          </div>

          {/* Paginación */}
          <RolesPagination
            totalItems={filteredRoles.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No hay roles registrados</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Comienza creando tu primer rol en el sistema</p>
        </div>
      )}
    </div>
  )
}

