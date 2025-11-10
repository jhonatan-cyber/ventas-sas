"use client"

import { useState } from "react"

import { UsersCards } from "./users-cards"
import { UsersFilters } from "./users-filters"
import { UsersPagination } from "./users-pagination"
import { UsersStats } from "./users-stats"
import { UsersTable } from "./users-table"

import { UserWithDetails } from "@/lib/services/admin/user-admin-service"

interface UsersContainerProps {
  users: UserWithDetails[]
  onEdit?: (user: UserWithDetails) => void
  onView?: (user: UserWithDetails) => void
  onToggleStatus?: (userId: string, currentStatus: boolean) => void
  onDelete?: (userId: string, userName: string) => void
}

export function UsersContainer({ users, onEdit, onView, onToggleStatus, onDelete }: UsersContainerProps) {
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
        user.ci?.toLowerCase().includes(searchLower)
      
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
    <div className="space-y-4 md:space-y-6 p-0 md:p-6">
      {/* Estadísticas */}
      <UsersStats users={users} />

      {/* Filtros */}
      <UsersFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Cards de usuarios (móvil) */}
      <UsersCards users={currentUsers} onEdit={onEdit} onView={onView} onToggleStatus={onToggleStatus} onDelete={onDelete} />

      {/* Tabla de usuarios (desktop) */}
      <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
        <UsersTable users={currentUsers} onEdit={onEdit} onView={onView} onToggleStatus={onToggleStatus} onDelete={onDelete} />
      </div>

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

