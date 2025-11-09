"use client"

import { useState, useEffect } from "react"
import { Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface CmsBlogPost {
  category?: string | null
}

interface CmsBlogFiltersProps {
  posts: CmsBlogPost[]
  onPageSizeChange?: (pageSize: number) => void
  onStatusChange?: (status: string) => void
  onCategoryChange?: (category: string) => void
  onOrganizationChange?: (orgId: string) => void
  onSearchChange?: (searchTerm: string) => void
}

export function CmsBlogFilters({
  posts,
  onPageSizeChange,
  onStatusChange,
  onCategoryChange,
  onOrganizationChange,
  onSearchChange,
}: CmsBlogFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState("10")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [selectedOrg, setSelectedOrg] = useState("all")

  // Extraer categorías únicas de los posts
  const categories = Array.from(new Set(posts.filter(p => p.category).map(p => p.category!)))

  useEffect(() => {
    // Cargar organizaciones
    fetch("/api/administracion/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizations) {
          setOrganizations(data.organizations)
        }
      })
      .catch(() => {})
  }, [])

  const handlePageSizeChange = (value: string) => {
    setPageSize(value)
    onPageSizeChange?.(parseInt(value))
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onStatusChange?.(value)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    onCategoryChange?.(value)
  }

  const handleOrganizationChange = (value: string) => {
    setSelectedOrg(value)
    onOrganizationChange?.(value)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearchChange?.(value)
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 mb-6 w-full">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Buscador */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar posts..."
              className="rounded-full pl-10 bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Selector de estado */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="rounded-full w-full md:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <SelectValue placeholder="Estado" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Todos</SelectItem>
            <SelectItem value="published" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Publicados</SelectItem>
            <SelectItem value="draft" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Borradores</SelectItem>
          </SelectContent>
        </Select>

        {/* Selector de categoría */}
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="rounded-full w-full md:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de organización */}
        <Select value={selectedOrg} onValueChange={handleOrganizationChange}>
          <SelectTrigger className="rounded-full w-full md:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectValue placeholder="Organización" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Todas</SelectItem>
            <SelectItem value="none" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">Sin organización</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id} className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de datos por página */}
        <Select value={pageSize} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="rounded-full w-full md:w-[180px] bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectValue placeholder="Por página" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectItem value="5" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">5 por página</SelectItem>
            <SelectItem value="10" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">10 por página</SelectItem>
            <SelectItem value="20" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">20 por página</SelectItem>
            <SelectItem value="50" className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">50 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
