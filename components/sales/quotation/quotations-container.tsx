"use client"

import { FC, useMemo, useState, useEffect } from "react"

import { QuotationsFilters } from "./quotations-filters"
import { QuotationsPagination } from "./quotations-pagination"
import { QuotationsStats } from "./quotations-stats"
import { QuotationsTable } from "./quotations-table"

import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"
import { Card, CardContent } from "@/components/ui/card"

const QuotationsTableComponent = QuotationsTable as unknown as FC<any>

export interface QuotationsContainerProps {
  quotations: SalesQuotationWithRelations[]
  isLoading?: boolean
  organizationId: string
  onEdit?: (quotation: SalesQuotationWithRelations) => void
  onDelete?: (quotation: SalesQuotationWithRelations) => void
  onViewDetails?: (quotation: SalesQuotationWithRelations) => void
  onConvert?: (quotation: SalesQuotationWithRelations) => void | Promise<void>
  showBranchColumn?: boolean
  branches?: { id: string; name: string | null }[]
  allowBranchFilter?: boolean
  onBranchFilterChange?: (branchId: string | null) => void
  selectedBranchFilter?: string | null
}

export const QuotationsContainer: FC<QuotationsContainerProps> = ({
  quotations,
  isLoading = false,
  organizationId: _organizationId,
  onEdit,
  onDelete,
  onViewDetails,
  onConvert,
  showBranchColumn = false,
  branches = [],
  allowBranchFilter = false,
  onBranchFilterChange,
  selectedBranchFilter,
}) => {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string | null>(selectedBranchFilter ?? null)

  useEffect(() => {
    setBranchFilter(selectedBranchFilter ?? null)
  }, [selectedBranchFilter])

  const branchOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string | null }>()
    let includeUnassigned = false

    branches.forEach((branch) => {
      if (!branch?.id) {
        return
      }
      if (!unique.has(branch.id)) {
        unique.set(branch.id, { id: branch.id, name: branch.name ?? "Sin sucursal" })
      }
    })

    quotations.forEach((quotation) => {
      const branchId = quotation.branchId ?? quotation.branch?.id ?? undefined
      const branchName =
        quotation.branch?.name ??
        unique.get(branchId ?? "")?.name ??
        "Sin sucursal"

      if (branchId) {
        if (!unique.has(branchId)) {
          unique.set(branchId, { id: branchId, name: branchName })
        }
      } else {
        includeUnassigned = true
      }
    })

    const options = Array.from(unique.values())

    if (includeUnassigned) {
      options.push({ id: "none", name: "Sin sucursal" })
    }

    return options
  }, [branches, quotations])

  // Filtrar cotizaciones por búsqueda y estado
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      const matchesStatus = statusFilter === "all" || quotation.status === statusFilter
      const normalizedQuotationBranchId = quotation.branchId ?? quotation.branch?.id ?? null
      const matchesBranch =
        !allowBranchFilter ||
        branchFilter === null ||
        (branchFilter === "none"
          ? !normalizedQuotationBranchId
          : normalizedQuotationBranchId === branchFilter)

      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          quotation.quotationNumber?.toLowerCase().includes(searchLower) ||
          `${quotation.customer?.name ?? ""} ${quotation.customer?.lastName ?? ""}`.trim().toLowerCase().includes(searchLower) ||
          quotation.customerName?.toLowerCase().includes(searchLower) ||
          quotation.notes?.toLowerCase().includes(searchLower)

        return matchesSearch && matchesStatus && matchesBranch
      }

      return matchesStatus && matchesBranch
    })
  }, [branchFilter, quotations, searchTerm, showBranchColumn, statusFilter])

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleBranchChange = (branchId: string | null) => {
    setBranchFilter(branchId)
    setCurrentPage(1)
    if (onBranchFilterChange) {
      onBranchFilterChange(branchId)
    }
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

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <QuotationsFilters 
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            statusValue={statusFilter}
            branches={branchOptions}
            selectedBranchId={branchFilter}
            onBranchChange={allowBranchFilter ? handleBranchChange : undefined}
            showBranchFilter={allowBranchFilter}
          />
        </CardContent>
      </Card>

      <div className="rounded-md border border-gray-200 bg-white dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm">
        <QuotationsTableComponent
          quotations={currentQuotations as any}
          isLoading={isLoading}
          onEditClick={onEdit as any}
          onDeleteClick={onDelete as any}
          onViewDetails={onViewDetails as any}
          onConvertClick={onConvert}
          showBranchColumn={showBranchColumn}
        />
      </div>

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

