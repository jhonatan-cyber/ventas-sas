"use client"

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"

interface PlansPaginationProps {
  totalItems: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  onPrevious: () => void
  onNext: () => void
}

export function PlansPagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPrevious,
  onNext,
}: PlansPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const maxPageButtons = 5

  const getPageNumbers = () => {
    const pageNumbers = []
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2))
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1)

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    return pageNumbers
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex justify-center mt-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) onPrevious()
              }}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {pageNumbers[0] > 1 && (
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
            </PaginationItem>
          )}
          {pageNumbers[0] > 2 && (
            <PaginationItem>
              <span className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
            </PaginationItem>
          )}

          {pageNumbers.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <PaginationItem>
              <span className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
            </PaginationItem>
          )}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(totalPages)}>{totalPages}</PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) onNext()
              }}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

