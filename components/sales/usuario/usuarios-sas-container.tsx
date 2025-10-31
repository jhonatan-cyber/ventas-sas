"use client"

import { useState } from "react"
import { UsuariosSasTable } from "./usuarios-sas-table"
import { UsuariosSasFilters } from "./usuarios-sas-filters"
import { UsuariosSasPagination } from "./usuarios-sas-pagination"
import { UsuariosSasStats } from "./usuarios-sas-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsuarioSas } from "@prisma/client"

interface UsuariosSasContainerProps {
  usuarios: (UsuarioSas & {
    rol: { id: string; nombre: string } | null
    sucursal: { id: string; name: string } | null
    customer: any
  })[]
  sucursalesCount?: number
  onEdit?: (usuario: UsuarioSas & { rol: any; sucursal: any }) => void
  onToggleStatus?: (usuario: UsuarioSas & { rol: any; sucursal: any }) => void
  onDelete?: (usuario: UsuarioSas & { rol: any; sucursal: any }) => void
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
        usuario.correo?.toLowerCase().includes(searchLower) ||
        usuario.telefono?.toLowerCase().includes(searchLower)
      
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
    <div className="space-y-6">
      {/* Estadísticas */}
      <UsuariosSasStats usuarios={usuarios} />

      {/* Filtros */}
      <UsuariosSasFilters 
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
                Usuarios ({filteredUsuarios.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredUsuarios.length === usuarios.length 
                  ? "Lista completa de usuarios disponibles"
                  : `Mostrando ${filteredUsuarios.length} de ${usuarios.length} usuarios`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <UsuariosSasTable 
              usuarios={currentUsuarios}
              sucursalesCount={sucursalesCount}
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

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

