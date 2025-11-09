"use client"

import { useState } from "react"
import { BillingStats } from "./billing-stats"
import { BillingFilters } from "./billing-filters"
import { InvoicesTable } from "./invoices-table"
import { InvoicesCards } from "./invoices-cards"
import { BillingPagination } from "./billing-pagination"
import { InvoiceWithRelations } from "@/lib/services/admin/billing-service"
import { BillingStats as BillingStatsType } from "@/lib/services/admin/billing-service"

interface BillingContainerProps {
  invoices: InvoiceWithRelations[]
  stats: BillingStatsType
  onView?: (invoice: InvoiceWithRelations) => void
  onDownloadPDF?: (invoice: InvoiceWithRelations) => void
  onPrintInvoice?: (invoice: InvoiceWithRelations) => void
  onSendCredentials?: (invoice: InvoiceWithRelations) => void
}

export function BillingContainer({ 
  invoices, 
  stats,
  onView, 
  onDownloadPDF, 
  onPrintInvoice,
  onSendCredentials
}: BillingContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar facturas por búsqueda y estado
  const filteredInvoices = invoices.filter(invoice => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.billingName?.toLowerCase().includes(searchLower) ||
        invoice.billingEmail?.toLowerCase().includes(searchLower) ||
        invoice.organization?.name?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "pending") return invoice.status === "pending"
    if (statusFilter === "paid") return invoice.status === "paid"
    if (statusFilter === "overdue") return invoice.status === "overdue"
    if (statusFilter === "cancelled") return invoice.status === "cancelled"
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  // Calcular facturas para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex)

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
    const totalPages = Math.ceil(filteredInvoices.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 p-0 md:p-6">
      {/* Estadísticas */}
      <BillingStats stats={stats} />

      {/* Filtros */}
      <BillingFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Cards de facturas (móvil) */}
      {filteredInvoices.length > 0 && (
        <InvoicesCards 
          invoices={currentInvoices} 
          onView={onView}
          onDownloadPDF={onDownloadPDF}
          onPrintInvoice={onPrintInvoice}
        />
      )}

      {/* Tabla de facturas (desktop) */}
      {filteredInvoices.length > 0 ? (
        <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a] overflow-x-auto">
          <InvoicesTable
            invoices={currentInvoices}
            loading={false}
            onFiltersChange={() => {}}
            onRefresh={() => {}}
            onInvoiceClick={onView}
            onDownloadPDF={onDownloadPDF}
            onPrintInvoice={onPrintInvoice}
            onSendCredentials={onSendCredentials}
          />
        </div>
      ) : (
        <div className="hidden md:block text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No se encontraron facturas</p>
        </div>
      )}

      {/* Paginación */}
      {filteredInvoices.length > 0 && (
        <BillingPagination
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  )
}

