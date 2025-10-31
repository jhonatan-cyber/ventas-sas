"use client"

import { useState } from "react"
import { CashRegistersTable } from "./cash-registers-table"
import { CashRegistersFilters } from "./cash-registers-filters"
import { CashRegistersPagination } from "./cash-registers-pagination"
import { CashRegistersStats } from "./cash-registers-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CashRegister } from "@prisma/client"

interface CashRegistersContainerProps {
  cashRegisters: Array<CashRegister & { branch?: any }>
  isLoading?: boolean
  onEdit?: (cashRegister: CashRegister) => void
  onOpen?: (cashRegister: CashRegister) => void
  onClose?: (cashRegister: CashRegister) => void
  onDelete?: (cashRegister: CashRegister) => void
}

export function CashRegistersContainer({ cashRegisters, isLoading = false, onEdit, onOpen, onClose, onDelete }: CashRegistersContainerProps) {
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
  )).map(id => cashRegisters.find(cr => cr.branch?.id === id)?.branch).filter(Boolean)

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

  const cardTitle = `Cajas (${filteredCashRegisters.length})`
  const cardDescription = filteredCashRegisters.length === cashRegisters.length
    ? "Lista completa de cajas registradas"
    : `Mostrando ${filteredCashRegisters.length} de ${cashRegisters.length} cajas`

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <CashRegistersStats cashRegisters={cashRegisters} />

      {/* Filtros */}
      <CashRegistersFilters 
        branches={branches as any[]}
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onBranchChange={handleBranchChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de cajas */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                {cardTitle}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {cardDescription}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <CashRegistersTable 
              cashRegisters={currentCashRegisters} 
              isLoading={isLoading}
              onEditClick={onEdit} 
              onOpenClick={onOpen}
              onCloseClick={onClose}
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

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

