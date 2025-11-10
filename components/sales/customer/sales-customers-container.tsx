"use client"

import { SalesCustomer } from "@prisma/client"
import { useState } from "react"

import { SalesCustomersFilters } from "./sales-customers-filters"
import { SalesCustomersPagination } from "./sales-customers-pagination"
import { SalesCustomersStats } from "./sales-customers-stats"
import { SalesCustomersTable } from "./sales-customers-table"

import { Card, CardContent } from "@/components/ui/card"

interface SalesCustomersContainerProps {
  customers: SalesCustomer[]
  isLoading?: boolean
  onEdit?: (customer: SalesCustomer) => void
  onToggleStatus?: (customer: SalesCustomer) => void
  onDelete?: (customer: SalesCustomer) => void
}

export function SalesCustomersContainer({ customers, isLoading = false, onEdit, onToggleStatus, onDelete }: SalesCustomersContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar clientes por búsqueda y estado
  const filteredCustomers = customers.filter(customer => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        (customer.name ? customer.name.toLowerCase().includes(searchLower) : false) ||
        (customer.lastName ? customer.lastName.toLowerCase().includes(searchLower) : false) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.ruc?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return customer.isActive
    if (statusFilter === "inactive") return !customer.isActive
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular clientes para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

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
      <SalesCustomersStats customers={customers} />

      {/* Filtros en Card */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <SalesCustomersFilters 
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
            statusValue={statusFilter}
          />
        </CardContent>
      </Card>

      {/* Tabla de clientes sin Card */}
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
        <SalesCustomersTable 
          customers={currentCustomers} 
          isLoading={isLoading}
          onEditClick={onEdit} 
          onToggleStatus={onToggleStatus} 
          onDeleteClick={onDelete} 
        />
      </div>

      {/* Paginación */}
      <div className="flex justify-center">
        <SalesCustomersPagination
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

