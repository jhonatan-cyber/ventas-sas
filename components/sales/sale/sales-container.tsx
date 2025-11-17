"use client"

import { useMemo, useState } from "react"

import { Receipt } from "lucide-react"

import { SalesCards } from "./sales-cards"
import { SalesFilters } from "./sales-filters"
import { SalesPagination } from "./sales-pagination"
import { SalesStats } from "./sales-stats"
import { SalesTable } from "./sales-table"
import { SalesSaleWithRelations } from "./types"

import { Card, CardContent } from "@/components/ui/card"

interface SalesBranchSummary {
  id: string
  name: string | null
}

interface SalesContainerProps {
  sales: SalesSaleWithRelations[]
  isLoading?: boolean
  onEdit?: (sale: SalesSaleWithRelations) => void
  onDelete?: (sale: SalesSaleWithRelations) => void
  onViewDetails?: (sale: SalesSaleWithRelations) => void
  onCancel?: (sale: SalesSaleWithRelations) => void
  branches?: SalesBranchSummary[]
  maxBranches?: number
}

export function SalesContainer({ 
  sales, 
  isLoading = false, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onCancel,
  branches = [],
  maxBranches
}: SalesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  // Inicializar con fechas vacías para mostrar todas las ventas por defecto
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        const customerName = sale.customer ? `${sale.customer.name ?? ''} ${sale.customer.lastName ?? ''}`.trim().toLowerCase() : ''
        const matchesSearch =
          sale.saleNumber.toLowerCase().includes(searchLower) ||
          (sale.notes ?? '').toLowerCase().includes(searchLower) ||
          customerName.includes(searchLower)

        if (!matchesSearch) return false
      }

      if (statusFilter !== "all" && sale.status !== statusFilter) {
        return false
      }

      if (paymentFilter !== "all" && sale.paymentMethod !== paymentFilter) {
        return false
      }

      // Filtro por sucursal
      if (branchFilter !== "all") {
        // Las ventas no tienen branchId directo, se filtra por la sucursal del usuario
        // Si necesitamos filtrar por sucursal, necesitaríamos agregar branchId a las ventas
        // Por ahora, omitimos este filtro si no está disponible
      }

      if (startDate) {
        const saleDate = sale.createdAt ? new Date(sale.createdAt) : null
        if (!saleDate || saleDate < new Date(startDate)) {
          return false
        }
      }

      if (endDate) {
        const saleDate = sale.createdAt ? new Date(sale.createdAt) : null
        if (!saleDate) return false
        const limit = new Date(endDate)
        limit.setHours(23, 59, 59, 999)
        if (saleDate > limit) {
          return false
        }
      }

      return true
    })
  }, [sales, searchTerm, statusFilter, paymentFilter, branchFilter, startDate, endDate])

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentSales = filteredSales.slice(startIndex, endIndex)

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePaymentChange = (method: string) => {
    setPaymentFilter(method)
    setCurrentPage(1)
  }

  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    setCurrentPage(1)
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    setCurrentPage(1)
  }

  const handleBranchChange = (branchId: string) => {
    setBranchFilter(branchId)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <SalesStats sales={sales} isLoading={isLoading} />

      {/* Filtros */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <SalesFilters
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onPaymentMethodChange={handlePaymentChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onBranchChange={branches.length > 0 ? handleBranchChange : undefined}
            selectedStatus={statusFilter}
            selectedPaymentMethod={paymentFilter}
            selectedBranch={branchFilter}
            startDate={startDate}
            endDate={endDate}
            branches={branches}
            maxBranches={maxBranches}
          />
        </CardContent>
      </Card>

      {/* Cards para móvil - Solo mostrar si hay ventas */}
      {sales.length > 0 && (
        <SalesCards
          sales={currentSales}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onCancel={onCancel}
        />
      )}

      {/* Tabla para desktop - Solo mostrar si hay ventas */}
      {sales.length > 0 && (
        <div className="hidden md:block">
          <SalesTable
            sales={currentSales}
            isLoading={isLoading}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onCancel={onCancel}
          />
        </div>
      )}

      {/* Mensaje cuando no hay ventas */}
      {!isLoading && filteredSales.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
              <Receipt className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No hay ventas registradas</p>
          </div>
        </div>
      )}

      {/* Paginación - Solo mostrar si hay datos y más datos que el tamaño de página */}
      {filteredSales.length > 0 && filteredSales.length > pageSize && (
        <div className="flex justify-center">
          <SalesPagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredSales.length / pageSize))}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
