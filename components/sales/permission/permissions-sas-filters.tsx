"use client"

import { Search } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PermissionsSasFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  showOnlyUnused: boolean
  setShowOnlyUnused: (value: boolean) => void
  categories: string[]
  pageSize: string
  onPageSizeChange?: (pageSize: number) => void
}

export function PermissionsSasFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  showOnlyUnused,
  setShowOnlyUnused,
  categories,
  pageSize,
  onPageSizeChange,
}: PermissionsSasFiltersProps) {
  const handlePageSizeChange = (value: string) => {
    onPageSizeChange?.(parseInt(value))
  }
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      {/* Búsqueda */}
      <div className="flex-1 w-full sm:w-auto">
        <Label
          htmlFor="search-permissions"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
          <Input
            id="search-permissions"
            placeholder="Buscar permisos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Filtro de categoría */}
      <div className="w-full sm:w-[180px]">
        <Label
          htmlFor="category-filter"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Categoría
        </Label>
        <Select
          onValueChange={setSelectedCategory}
          value={selectedCategory}
          defaultValue="all"
        >
          <SelectTrigger id="category-filter" className="w-full">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Checkbox para no usados */}
      <div className="w-full sm:w-[180px]">
        <Label
          htmlFor="unused-filter"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          Filtro
        </Label>
        <div className="flex items-center space-x-2 h-9 px-3 border border-input bg-background rounded-md">
          <Checkbox
            id="unused-filter"
            checked={showOnlyUnused}
            onCheckedChange={(checked) => setShowOnlyUnused(checked === true)}
          />
          <Label
            htmlFor="unused-filter"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Solo no usados
          </Label>
        </div>
      </div>

      {/* Tamaño de página */}
      {onPageSizeChange && (
        <div className="w-full sm:w-[150px]">
          <Label
            htmlFor="page-size"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            Datos
          </Label>
          <Select
            onValueChange={handlePageSizeChange}
            value={pageSize}
            defaultValue="10"
          >
            <SelectTrigger id="page-size" className="w-full">
              <SelectValue placeholder="Por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

