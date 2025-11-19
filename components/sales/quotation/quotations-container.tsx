"use client"

import { FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import { FC, memo, useMemo, useState, useEffect } from "react"

import { QuotationsCards } from "./quotations-cards"
import { QuotationsFilters } from "./quotations-filters"
import { QuotationsPagination } from "./quotations-pagination"
import { QuotationsStats } from "./quotations-stats"
import { QuotationsTable } from "./quotations-table"

import { SalesQuotationWithRelations } from "@/components/sales/quotation/types"
import { Card, CardContent } from "@/components/ui/card"
import { getTranslatableText } from "@/lib/utils/translatable-text"

const QuotationsTableComponent = QuotationsTable as unknown as FC<any>

export interface QuotationsContainerProps {
  quotations: SalesQuotationWithRelations[]
  isLoading?: boolean
  organizationId: string
  customerSlug: string
  onEdit?: (quotation: SalesQuotationWithRelations) => void
  onDelete?: (quotation: SalesQuotationWithRelations) => void
  onViewDetails?: (quotation: SalesQuotationWithRelations) => void
  onConvert?: (quotation: SalesQuotationWithRelations) => void | Promise<void>
  showBranchColumn?: boolean
  branches?: { id: string; name: string | null }[]
  allowBranchFilter?: boolean
  maxBranches?: number | null
  onBranchFilterChange?: (branchId: string | null) => void
  selectedBranchFilter?: string | null
}

const QuotationsContainerComponent: FC<QuotationsContainerProps> = ({
  quotations,
  isLoading = false,
  organizationId: _organizationId,
  customerSlug,
  onEdit,
  onDelete,
  onViewDetails,
  onConvert,
  showBranchColumn = false,
  branches = [],
  allowBranchFilter = false,
  maxBranches,
  onBranchFilterChange,
  selectedBranchFilter,
}) => {
  const t = useTranslations()
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
        unique.set(branch.id, { id: branch.id, name: branch.name ?? t('common.noBranch') })
      }
    })

    quotations.forEach((quotation) => {
      const branchId = quotation.branchId ?? quotation.branch?.id ?? undefined
      const branchName =
        quotation.branch?.name ??
        unique.get(branchId ?? "")?.name ??
        t('common.noBranch')

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
      options.push({ id: "none", name: t('common.noBranch') })
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
        // Obtener notas traducidas para búsqueda
        const currentLanguage = (() => {
          try {
            const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
            return prefs?.language || 'es';
          } catch {
            return 'es';
          }
        })();
        const notes = getTranslatableText(
          quotation.notes,
          (quotation as any).notesTranslations,
          currentLanguage
        ) || "";
        const matchesSearch =
          quotation.quotationNumber?.toLowerCase().includes(searchLower) ||
          `${quotation.customer?.name ?? ""} ${quotation.customer?.lastName ?? ""}`.trim().toLowerCase().includes(searchLower) ||
          quotation.customerName?.toLowerCase().includes(searchLower) ||
          notes.toLowerCase().includes(searchLower)

        return matchesSearch && matchesStatus && matchesBranch
      }

      return matchesStatus && matchesBranch
    })
  }, [branchFilter, quotations, searchTerm, statusFilter, allowBranchFilter])

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
            showBranchFilter={allowBranchFilter && !(maxBranches === 1 && branchOptions.length === 1)}
            maxBranches={maxBranches}
          />
        </CardContent>
      </Card>

      {/* Mostrar cards y tabla solo si hay cotizaciones */}
      {currentQuotations.length > 0 ? (
        <>
          {/* Cards de cotizaciones (solo móvil) */}
          <QuotationsCards
            customerSlug={customerSlug}
            quotations={currentQuotations as any}
            showBranchColumn={showBranchColumn}
            onEdit={onEdit as any}
            onDelete={onDelete as any}
            onViewDetails={onViewDetails as any}
            onConvert={onConvert}
            maxBranches={maxBranches}
          />

          {/* Tabla de cotizaciones (solo desktop) */}
          <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden">
            <QuotationsTableComponent
              quotations={currentQuotations as any}
              isLoading={isLoading}
              onEditClick={onEdit as any}
              onDeleteClick={onDelete as any}
              onViewDetails={onViewDetails as any}
              onConvertClick={onConvert}
              showBranchColumn={showBranchColumn && !(maxBranches === 1 && branches.length === 1)}
              branches={branches}
              maxBranches={maxBranches}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No hay cotizaciones registradas</p>
          </div>
        </div>
      )}

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

QuotationsContainerComponent.displayName = "QuotationsContainer"

export const QuotationsContainer = memo(QuotationsContainerComponent)

