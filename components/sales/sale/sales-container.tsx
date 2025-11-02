"use client"

import { useMemo, useState } from "react"
import { SalesStats } from "./sales-stats"
import { SalesFilters } from "./sales-filters"
import { SalesTable } from "./sales-table"
import { SalesPagination } from "./sales-pagination"
import { SalesSaleWithRelations } from "./types"
import { Card } from "@/components/ui/card"

interface SalesContainerProps {
  sales: SalesSaleWithRelations[]
  isLoading?: boolean
  onEdit?: (sale: SalesSaleWithRelations) => void
  onDelete?: (sale: SalesSaleWithRelations) => void
  onViewDetails?: (sale: SalesSaleWithRelations) => void
  onCancel?: (sale: SalesSaleWithRelations) => void
}

export function SalesContainer({ 
  sales, 
  isLoading = false, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onCancel 
}: SalesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
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
  }, [sales, searchTerm, statusFilter, paymentFilter, startDate, endDate])

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

      <SalesFilters
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPaymentMethodChange={handlePaymentChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        selectedStatus={statusFilter}
        selectedPaymentMethod={paymentFilter}
        startDate={startDate}
        endDate={endDate}
      />

      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] p-0 overflow-hidden">
        <SalesTable
          sales={currentSales}
          isLoading={isLoading}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onCancel={onCancel}
        />
      </Card>

      <div className="flex justify-center">
        <SalesPagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filteredSales.length / pageSize))}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
