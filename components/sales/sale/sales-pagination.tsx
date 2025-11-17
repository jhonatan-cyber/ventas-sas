"use client"

import { Button } from "@/components/ui/button"

interface SalesPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function SalesPagination({ currentPage, totalPages, onPageChange }: SalesPaginationProps) {
  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-center gap-2 w-full py-4">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full text-xs sm:text-sm"
        disabled={!hasPrevious}
        onClick={() => hasPrevious && onPageChange(currentPage - 1)}
      >
        Anterior
      </Button>
      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full text-xs sm:text-sm"
        disabled={!hasNext}
        onClick={() => hasNext && onPageChange(currentPage + 1)}
      >
        Siguiente
      </Button>
    </div>
  )
}
