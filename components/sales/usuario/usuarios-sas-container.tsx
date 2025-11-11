"use client"

import { UsuarioSas } from "@prisma/client"
import { useState } from "react"

import { UsuariosSasFilters } from "./usuarios-sas-filters"
import { UsuariosSasPagination } from "./usuarios-sas-pagination"
import { UsuariosSasStats } from "./usuarios-sas-stats"
import { UsuariosSasTable } from "./usuarios-sas-table"

import { Card, CardContent } from "@/components/ui/card"

interface UsuariosSasContainerProps {
  usuarios: (UsuarioSas & {
    rol?: { id: string; nombre: string } | null
    sucursal?: { id: string; name: string } | null
    customer?: any
  })[]
  sucursalesCount?: number
  onEdit?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
  onToggleStatus?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
  onDelete?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
}

export function UsuariosSasContainer({ usuarios, sucursalesCount, onEdit, onToggleStatus, onDelete }: UsuariosSasContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar usuarios por búsqueda y estado
  const filteredUsuarios = usuarios.filter(usuario => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        usuario.nombre?.toLowerCase().includes(searchLower) ||
        usuario.apellido?.toLowerCase().includes(searchLower) ||
        usuario.ci?.toLowerCase().includes(searchLower) ||
        usuario.email?.toLowerCase().includes(searchLower) ||
        usuario.phone?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return usuario.isActive
    if (statusFilter === "inactive") return !usuario.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular usuarios para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex)

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
      <UsuariosSasStats usuarios={usuarios} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <UsuariosSasFilters 
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
            statusValue={statusFilter}
          />
        </CardContent>
      </Card>

      {/* Tabla de usuarios sin Card */}
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
        <UsuariosSasTable 
          usuarios={currentUsuarios}
          sucursalesCount={sucursalesCount}
          onEditClick={onEdit} 
          onToggleStatus={onToggleStatus} 
          onDeleteClick={onDelete} 
        />
      </div>

      {/* Paginación */}
      <div className="flex justify-center">
        <UsuariosSasPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsuarios.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

