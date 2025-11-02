"use client"

import { useEffect, useMemo, useState } from "react"
import { ExpensesTable } from "./expenses-table"
import { ExpensesFilters } from "./expenses-filters"
import { ExpensesPagination } from "./expenses-pagination"
import { ExpensesStats } from "./expenses-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesExpenseWithRelations, ExpenseBranchSummary } from "./types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExpensesContainerProps {
  expenses: SalesExpenseWithRelations[]
  branches: ExpenseBranchSummary[]
  isLoading?: boolean
  onEdit?: (expense: SalesExpenseWithRelations) => void
  onDelete?: (expense: SalesExpenseWithRelations) => void
}

export function ExpensesContainer({ expenses, branches, isLoading = false, onEdit, onDelete }: ExpensesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const branchOptions = useMemo(() => {
    if (!branches || branches.length === 0) return []
    return branches.filter((branch) => Boolean(branch?.id))
  }, [branches])

  useEffect(() => {
    if (branchOptions.length <= 1 && branchFilter !== "all") {
      setBranchFilter("all")
    }
  }, [branchOptions.length, branchFilter])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          expense.name.toLowerCase().includes(searchLower) ||
          expense.description.toLowerCase().includes(searchLower) ||
          (expense.user?.fullName?.toLowerCase() ?? "").includes(searchLower) ||
          (expense.branch?.name?.toLowerCase() ?? "").includes(searchLower)

        if (!matchesSearch) return false
      }

      if (branchFilter !== "all") {
        if ((expense.branchId ?? "none") !== branchFilter) {
          return false
        }
      }

      if (startDate) {
        const expenseDate = new Date(expense.date)
        if (expenseDate < new Date(startDate)) {
          return false
        }
      }

      if (endDate) {
        const expenseDate = new Date(expense.date)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (expenseDate > end) {
          return false
        }
      }

      return true
    })
  }, [branchFilter, endDate, expenses, searchTerm, startDate])

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleBranchChange = (branchId: string) => {
    setBranchFilter(branchId)
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

  // Calcular gastos para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex)

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
      <ExpensesStats expenses={expenses} isLoading={isLoading} />

      {/* Filtros */}
      <ExpensesFilters 
        branches={branchOptions}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onBranchChange={handleBranchChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        selectedBranch={branchFilter}
        startDate={startDate}
        endDate={endDate}
        showBranchFilter={branchOptions.length > 1}
      />

      {/* Tabla de gastos */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Gastos ({filteredExpenses.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredExpenses.length === expenses.length 
                  ? "Lista completa de gastos registrados"
                  : `Mostrando ${filteredExpenses.length} de ${expenses.length} gastos`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
            <ExpensesTable 
              expenses={currentExpenses} 
              isLoading={isLoading}
              onEditClick={onEdit} 
              onDeleteClick={onDelete} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-center">
        <ExpensesPagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredExpenses.length / pageSize)}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

