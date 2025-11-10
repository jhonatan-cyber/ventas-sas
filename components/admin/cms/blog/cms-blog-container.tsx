"use client"

import { useState } from "react"

import { CmsBlogCards } from "./cms-blog-cards"
import { CmsBlogFilters } from "./cms-blog-filters"
import { CmsBlogHeader } from "./cms-blog-header"
import { CmsBlogPagination } from "./cms-blog-pagination"
import { CmsBlogStats } from "./cms-blog-stats"
import { CmsBlogTable } from "./cms-blog-table"

interface CmsBlogPost {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  content: string
  excerpt?: string | null
  featuredImage?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  tags: string[]
  category?: string | null
  isPublished: boolean
  publishedAt?: string | null
  viewCount: number
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

interface CmsBlogContainerProps {
  posts: CmsBlogPost[]
  total: number
  isLoading: boolean
  onNewClick: () => void
  onEdit: (post: CmsBlogPost) => void
  onDelete: (post: CmsBlogPost) => void
  onTogglePublish: (post: CmsBlogPost) => void
  onPreview?: (post: CmsBlogPost) => void
  onRefresh: (organizationId?: string, category?: string, isPublished?: boolean) => void
}

export function CmsBlogContainer({
  posts,
  total,
  isLoading,
  onNewClick,
  onEdit,
  onDelete,
  onTogglePublish,
  onPreview,
  onRefresh,
}: CmsBlogContainerProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [organizationFilter, setOrganizationFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar posts
  const filteredPosts = posts.filter(post => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        post.title.toLowerCase().includes(searchLower) ||
        post.slug.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))

      if (!matchesSearch) return false
    }

    // Filtrar por estado
    if (statusFilter === "published") return post.isPublished
    if (statusFilter === "draft") return !post.isPublished

    // Filtrar por categoría
    if (categoryFilter !== "all" && post.category !== categoryFilter) return false

    // Filtrar por organización
    if (organizationFilter !== "all") {
      if (organizationFilter === "none" && post.organizationId) return false
      if (organizationFilter !== "none" && post.organizationId !== organizationFilter) return false
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

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category)
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

  // Calcular posts para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPosts = filteredPosts.slice(startIndex, endIndex)

  const totalPages = Math.ceil(filteredPosts.length / pageSize)

  return (
    <div className="space-y-4 md:space-y-6 p-0 md:p-6">
      {/* Header */}
      <CmsBlogHeader onNewClick={onNewClick} />

      {/* Estadísticas */}
      <CmsBlogStats posts={posts} />

      {/* Filtros */}
      <CmsBlogFilters
        posts={posts}
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onCategoryChange={handleCategoryChange}
        onOrganizationChange={handleOrganizationChange}
        onSearchChange={handleSearchChange}
      />

      {/* Cards (móvil) */}
      <CmsBlogCards
        posts={currentPosts}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
      />

      {/* Tabla (desktop) */}
      {posts.length > 0 && (
        <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
          <CmsBlogTable
            posts={currentPosts}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePublish={onTogglePublish}
            onPreview={onPreview}
          />
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <CmsBlogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
