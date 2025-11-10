"use client"

import { useState } from "react"

import { CmsPagesCards } from "./cms-pages-cards"
import { CmsPagesFilters } from "./cms-pages-filters"
import { CmsPagesHeader } from "./cms-pages-header"
import { CmsPagesPagination } from "./cms-pages-pagination"
import { CmsPagesStats } from "./cms-pages-stats"
import { CmsPagesTable } from "./cms-pages-table"

interface CmsPage {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  content: string
  excerpt?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  pageType: string
  isPublished: boolean
  publishedAt?: string | null
  order: number
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    fullName: string | null
    email: string
  } | null
  updatedBy?: {
    id: string
    fullName: string | null
    email: string
  } | null
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsPagesContainerProps {
  pages: CmsPage[]
  total: number
  isLoading: boolean
  onNewClick: () => void
  onEdit: (page: CmsPage) => void
  onDelete: (page: CmsPage) => void
  onTogglePublish: (page: CmsPage) => void
  onPreview?: (page: CmsPage) => void
  onRefresh: (organizationId?: string, pageType?: string, isPublished?: boolean) => void
}

export function CmsPagesContainer({
  pages,
  total,
  isLoading,
  onNewClick,
  onEdit,
  onDelete,
  onTogglePublish,
  onPreview,
  onRefresh,
}: CmsPagesContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [pageTypeFilter, setPageTypeFilter] = useState("all")
  const [organizationFilter, setOrganizationFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar páginas
  const filteredPages = pages.filter(page => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower) ||
        page.excerpt?.toLowerCase().includes(searchLower) ||
        page.content.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "published") return page.isPublished
    if (statusFilter === "draft") return !page.isPublished

    // Filtrar por tipo
    if (pageTypeFilter !== "all" && page.pageType !== pageTypeFilter) return false

    // Filtrar por organización
    if (organizationFilter !== "all") {
      if (organizationFilter === "none" && page.organizationId) return false
      if (organizationFilter !== "none" && page.organizationId !== organizationFilter) return false
    }

    return true
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePageTypeChange = (type: string) => {
    setPageTypeFilter(type)
    setCurrentPage(1)
  }

  const handleOrganizationChange = (orgId: string) => {
    setOrganizationFilter(orgId)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Calcular páginas para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPages = filteredPages.slice(startIndex, endIndex)

  const totalPages = Math.ceil(filteredPages.length / pageSize)

  return (
    <div className="space-y-4 md:space-y-6 p-0 md:p-6">
      {/* Header */}
      <CmsPagesHeader onNewClick={onNewClick} />

      {/* Estadísticas */}
      <CmsPagesStats pages={pages} />

      {/* Filtros */}
      <CmsPagesFilters
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onPageTypeChange={handlePageTypeChange}
        onOrganizationChange={handleOrganizationChange}
        onSearchChange={handleSearchChange}
      />

      {/* Cards (móvil) */}
      <CmsPagesCards
        pages={currentPages}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
      />

      {/* Tabla (desktop) */}
      {pages.length > 0 && (
        <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
          <CmsPagesTable
            pages={currentPages}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePublish={onTogglePublish}
            onPreview={onPreview}
            organizationSlug={currentPages[0]?.organization?.slug}
          />
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <CmsPagesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

