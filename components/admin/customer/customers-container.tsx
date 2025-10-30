"use client"

import { useState } from "react"
import { CustomersStats } from "./customers-stats"
import { CustomersFilters } from "./customers-filters"
import { CustomersTable } from "./customers-table"
import { CustomersPagination } from "./customers-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Customer } from "@/lib/types"

interface CustomersContainerProps {
  customers: Customer[]
  onEdit?: (customer: Customer) => void
  onToggleStatus?: (customer: Customer) => void
  onDelete?: (customer: Customer) => void
}

export function CustomersContainer({ customers, onEdit, onToggleStatus, onDelete }: CustomersContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar clientes por búsqueda y estado
  const filteredCustomers = customers.filter(customer => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.nombre?.toLowerCase().includes(searchLower) ||
        customer.apellido?.toLowerCase().includes(searchLower) ||
        customer.razonSocial?.toLowerCase().includes(searchLower) ||
        customer.nit?.toLowerCase().includes(searchLower) ||
        customer.ci?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return customer.isActive
    if (statusFilter === "inactive") return !customer.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  // Calcular clientes para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

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
    const totalPages = Math.ceil(filteredCustomers.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Estadísticas */}
      <CustomersStats customers={customers} />

      {/* Filtros */}
      <CustomersFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de clientes */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Clientes ({filteredCustomers.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredCustomers.length === customers.length 
                  ? "Lista completa de clientes disponibles"
                  : `Mostrando ${filteredCustomers.length} de ${customers.length} clientes`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <CustomersTable 
              customers={currentCustomers} 
              onEditClick={onEdit} 
              onToggleStatus={onToggleStatus} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-center">
        <CustomersPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCustomers.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

