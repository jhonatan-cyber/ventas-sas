"use client"

import { useState } from "react"
import { UsersStats } from "./users-stats"
import { UsersFilters } from "./users-filters"
import { UsersTable } from "./users-table"
import { UsersPagination } from "./users-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"

interface UsersContainerProps {
  users: UserWithDetails[]
  onEdit?: (user: UserWithDetails) => void
  onToggleStatus?: (userId: string, currentStatus: boolean) => void
  onDelete?: (userId: string, userName: string) => void
}

export function UsersContainer({ users, onEdit, onToggleStatus, onDelete }: UsersContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar usuarios por búsqueda y estado
  const filteredUsers = users.filter(user => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        user.email.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.companyName?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return user.isActive
    if (statusFilter === "inactive") return !user.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  // Calcular usuarios para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

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
    const totalPages = Math.ceil(filteredUsers.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Estadísticas */}
      <UsersStats users={users} />

      {/* Filtros */}
      <UsersFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de usuarios */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Usuarios ({filteredUsers.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredUsers.length === users.length 
                  ? "Lista completa de usuarios disponibles en el sistema"
                  : `Mostrando ${filteredUsers.length} de ${users.length} usuarios`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <UsersTable users={currentUsers} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <UsersPagination
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

