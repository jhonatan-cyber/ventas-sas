"use client"

import { useState } from "react"
import { ExpensesTable } from "./expenses-table"
import { ExpensesFilters } from "./expenses-filters"
import { ExpensesPagination } from "./expenses-pagination"
import { ExpensesStats } from "./expenses-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Expense } from "@prisma/client"

interface ExpensesContainerProps {
  expenses: Array<Expense & { user?: any }>
  organizationId: string
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
}

export function ExpensesContainer({ expenses, organizationId, onEdit, onDelete }: ExpensesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Obtener categorías únicas
  const categories = Array.from(new Set(expenses.map(e => e.category)))

  // Filtrar gastos por búsqueda y categoría
  const filteredExpenses = expenses.filter(expense => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.category?.toLowerCase().includes(searchLower) ||
        expense.user?.fullName?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por categoría
    if (categoryFilter !== "all") {
      return expense.category === categoryFilter
    }
    return true
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular gastos para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex)

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category)
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
      <ExpensesStats expenses={expenses} />

      {/* Filtros */}
      <ExpensesFilters 
        categories={categories}
        onPageSizeChange={handlePageSizeChange}
        onCategoryChange={handleCategoryChange}
        onSearchChange={handleSearchChange}
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

