"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface CashRegistersPaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function CashRegistersPagination({
  currentPage,
  totalPages,
  pageSize: _pageSize,
  onPageChange,
  onPageSizeChange: _onPageSizeChange
}: CashRegistersPaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-4">
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs sm:text-sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1 sm:mr-0" />
          <span className="sm:inline">Anterior</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs sm:text-sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          <span className="sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4 ml-1 sm:ml-0" />
        </Button>
      </div>
    </div>
  )
}

