"use client"

import { Search, X, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
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

interface PermissionsFiltersProps {
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

export function PermissionsFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  showOnlyUnused,
  setShowOnlyUnused,
  categories,
  pageSize,
  onPageSizeChange,
}: PermissionsFiltersProps) {
  const handlePageSizeChange = (value: string) => {
    onPageSizeChange?.(parseInt(value))
  }
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Filter className="h-4 w-4" />
        Filtros
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 rounded-full"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Categoría */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Todas las categorías" />
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

        {/* Checkbox para no usados */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="unused-only"
            checked={showOnlyUnused}
            onCheckedChange={(checked) => setShowOnlyUnused(checked === true)}
          />
          <Label
            htmlFor="unused-only"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Solo no usados
          </Label>
        </div>

        {/* Selector de datos por página */}
        {onPageSizeChange && (
          <Select value={pageSize} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

