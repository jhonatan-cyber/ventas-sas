"use client"

import { FC, useMemo, useState } from "react"
import { QuotationsTable } from "./quotations-table"
import { QuotationsFilters } from "./quotations-filters"
import { QuotationsPagination } from "./quotations-pagination"
import { QuotationsStats } from "./quotations-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"

const QuotationsTableComponent = QuotationsTable as unknown as FC<any>

export interface QuotationsContainerProps {
  quotations: SalesQuotationWithRelations[]
  isLoading?: boolean
  organizationId: string
  onEdit?: (quotation: SalesQuotationWithRelations) => void
  onDelete?: (quotation: SalesQuotationWithRelations) => void
  onViewDetails?: (quotation: SalesQuotationWithRelations) => void
  showBranchColumn?: boolean
}

export const QuotationsContainer: FC<QuotationsContainerProps> = ({
  quotations,
  isLoading = false,
  organizationId: _organizationId,
  onEdit,
  onDelete,
  onViewDetails,
  showBranchColumn = false,
}) => {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filtrar cotizaciones por búsqueda y estado
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter

      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          quotation.quotationNumber?.toLowerCase().includes(searchLower) ||
          `${quotation.customer?.name ?? ""} ${quotation.customer?.lastName ?? ""}`.trim().toLowerCase().includes(searchLower) ||
          quotation.customerName?.toLowerCase().includes(searchLower) ||
          quotation.notes?.toLowerCase().includes(searchLower)

        return matchesSearch && matchesStatus
      }

      return matchesStatus
    })
  }, [quotations, searchTerm, statusFilter])

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // Calcular cotizaciones para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex)

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      <QuotationsStats quotations={quotations as any} isLoading={isLoading} />

      <QuotationsFilters 
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shadow-sm">
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
            <QuotationsTableComponent
              quotations={currentQuotations as any}
              isLoading={isLoading}
              onEditClick={onEdit as any}
              onDeleteClick={onDelete as any}
              onViewDetails={onViewDetails as any}
              showBranchColumn={showBranchColumn}
            />
          </div>
        </CardContent>
      </Card>

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

