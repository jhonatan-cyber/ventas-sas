"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface QuotationsPaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function QuotationsPagination({
  currentPage,
  totalPages,
  pageSize: _pageSize,
  onPageChange,
  onPageSizeChange: _onPageSizeChange
}: QuotationsPaginationProps) {
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex justify-center sm:justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

