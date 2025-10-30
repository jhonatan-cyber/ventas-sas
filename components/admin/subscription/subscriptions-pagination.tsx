"use client"

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"

interface SubscriptionsPaginationProps {
  totalItems: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  onPrevious: () => void
  onNext: () => void
}

export function SubscriptionsPagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPrevious,
  onNext,
}: SubscriptionsPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  const pages = getPageNumbers()

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
          
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                </PaginationItem>
              )
            }
            
            const pageNum = page as number
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === pageNum}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(pageNum)
                  }}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          })}
          
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
