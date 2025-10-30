"use client"

import { useState } from "react"
import { QuotationsTable } from "./quotations-table"
import { QuotationsFilters } from "./quotations-filters"
import { QuotationsPagination } from "./quotations-pagination"
import { QuotationsStats } from "./quotations-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Quotation } from "@prisma/client"

interface QuotationsContainerProps {
  quotations: Array<Quotation & { customer?: any; items?: any[] }>
  organizationId: string
  onEdit?: (quotation: Quotation) => void
  onStatusChange?: (quotation: Quotation, newStatus: string) => void
  onDelete?: (quotation: Quotation) => void
}

export function QuotationsContainer({ quotations, organizationId, onEdit, onStatusChange, onDelete }: QuotationsContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar cotizaciones por búsqueda y estado
  const filteredQuotations = quotations.filter(quotation => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        quotation.quotationNumber?.toLowerCase().includes(searchLower) ||
        quotation.customer?.name?.toLowerCase().includes(searchLower) ||
        quotation.notes?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      return quotation.status === statusFilter
    }
    return true
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular cotizaciones para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex)

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
      <QuotationsStats quotations={quotations} />

      {/* Filtros */}
      <QuotationsFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de cotizaciones */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Cotizaciones ({filteredQuotations.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredQuotations.length === quotations.length 
                  ? "Lista completa de cotizaciones disponibles"
                  : `Mostrando ${filteredQuotations.length} de ${quotations.length} cotizaciones`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <QuotationsTable 
              quotations={currentQuotations} 
              onEditClick={onEdit} 
              onStatusChange={onStatusChange} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-center">
        <QuotationsPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredQuotations.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

