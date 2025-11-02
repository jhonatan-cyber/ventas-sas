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
    <div className="flex items-center justify-center gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={!hasPrevious}
        onClick={() => hasPrevious && onPageChange(currentPage - 1)}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={!hasNext}
        onClick={() => hasNext && onPageChange(currentPage + 1)}
      >
        Siguiente
      </Button>
    </div>
  )
}
