"use client"

import { useState } from "react"

import { CashRegistersFilters } from "./cash-registers-filters"
import { CashRegistersPagination } from "./cash-registers-pagination"
import { CashRegistersStats } from "./cash-registers-stats"
import { CashRegistersTable } from "./cash-registers-table"

import type { CashRegisterWithRelations } from "./types"

import { Card, CardContent } from "@/components/ui/card"

interface CashRegistersContainerProps {
  cashRegisters: CashRegisterWithRelations[]
  isLoading?: boolean
  onViewDetails?: (cashRegister: CashRegisterWithRelations) => void
  onOpen?: (cashRegister: CashRegisterWithRelations) => void
  onClose?: (cashRegister: CashRegisterWithRelations) => void
  onDelete?: (cashRegister: CashRegisterWithRelations) => void
  maxBranches?: number | null
}

export function CashRegistersContainer({ cashRegisters, isLoading = false, onViewDetails, onOpen, onClose, onDelete, maxBranches }: CashRegistersContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Obtener sucursales únicas
  const branches = Array.from(new Set(
    cashRegisters
      .filter(cr => cr.branch)
      .map(cr => cr.branch!.id)
  ))
    .map(id => cashRegisters.find(cr => cr.branch?.id === id)?.branch)
    .filter(Boolean)
  
  // Determinar si mostrar información de sucursal basado en maxBranches
  const shouldShowBranchInfo = maxBranches === undefined || maxBranches === null || maxBranches > 1

  // Filtrar cajas por búsqueda, estado y sucursal
  const filteredCashRegisters = cashRegisters.filter(cashRegister => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        cashRegister.name?.toLowerCase().includes(searchLower) ||
        cashRegister.branch?.name?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      if (statusFilter === "open") return cashRegister.isOpen
      if (statusFilter === "closed") return !cashRegister.isOpen
    }

    // Filtrar por sucursal
    if (branchFilter !== "all") {
      if (!cashRegister.branchId) return false
      return cashRegister.branchId === branchFilter
    }

    return true
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular cajas para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCashRegisters = filteredCashRegisters.slice(startIndex, endIndex)

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleBranchChange = (branch: string) => {
    setBranchFilter(branch)
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
      <CashRegistersStats cashRegisters={cashRegisters} />

      {/* Filtros */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <CashRegistersFilters 
            branches={branches as any[]}
            onPageSizeChange={handlePageSizeChange}
            onStatusChange={handleStatusChange}
            onBranchChange={handleBranchChange}
            onSearchChange={handleSearchChange}
            maxBranches={maxBranches}
          />
        </CardContent>
      </Card>

      {/* Tabla de cajas */}
      <CashRegistersTable 
        cashRegisters={currentCashRegisters} 
        isLoading={isLoading}
        onViewDetails={onViewDetails}
        onOpenClick={onOpen}
        onCloseClick={onClose}
        onDeleteClick={onDelete}
        showBranchInfo={shouldShowBranchInfo}
      />

      {/* Paginación */}
      <div className="flex justify-center">
        <CashRegistersPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCashRegisters.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

