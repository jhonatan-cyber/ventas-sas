"use client"

import { useState } from "react"
import { PlansStats } from "./plans-stats"
import { PlansFilters } from "./plans-filters"
import { PlansTable } from "./plans-table"
import { PlansPagination } from "./plans-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SerializedSubscriptionPlanWithStats } from "./types"

interface PlansContainerProps {
  plans: SerializedSubscriptionPlanWithStats[]
  onEdit?: (plan: SerializedSubscriptionPlanWithStats) => void
  onToggleStatus?: (planId: string, currentStatus: boolean) => void
  onDelete?: (planId: string, planName: string) => void
}

export function PlansContainer({ plans, onEdit, onToggleStatus, onDelete }: PlansContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar planes por búsqueda y estado
  const filteredPlans = plans.filter(plan => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        plan.name.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "active") return plan.isActive ?? true
    if (statusFilter === "inactive") return !(plan.isActive ?? true)
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Calcular planes para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPlans = filteredPlans.slice(startIndex, endIndex)

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
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
    const totalPages = Math.ceil(filteredPlans.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Estadísticas */}
      <PlansStats plans={plans} />

      {/* Filtros */}
      <PlansFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla de planes */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                Planes ({filteredPlans.length})
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredPlans.length === plans.length 
                  ? "Lista completa de planes disponibles en el sistema"
                  : `Mostrando ${filteredPlans.length} de ${plans.length} planes`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PlansTable plans={currentPlans} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
        </CardContent>
      </Card>

      {/* Paginación */}
      <PlansPagination
        totalItems={filteredPlans.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

