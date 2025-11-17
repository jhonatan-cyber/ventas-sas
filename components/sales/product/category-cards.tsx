"use client"

import { Category } from "@prisma/client"
import { ShoppingBag, ChevronRight, Package, Search, X, ChevronLeft } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CategoryCardsProps {
  categories: Category[]
  onCategorySelect: (categoryId: string) => void
  customerSlug?: string
}

interface CategoryWithCount extends Category {
  productCount?: number
}

export function CategoryCards({ categories, onCategorySelect, customerSlug }: CategoryCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [categoriesWithCounts, setCategoriesWithCounts] = useState<CategoryWithCount[]>(categories)
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)

  // Obtener conteos de productos por categoría
  useEffect(() => {
    if (!customerSlug) return

    const fetchProductCounts = async () => {
      try {
        const countsPromises = categories.map(async (category) => {
          try {
            const response = await fetch(
              `/api/${customerSlug}/productos?categoryId=${category.id}&page=1&pageSize=1`
            )
            const data = await response.json()
            return {
              ...category,
              productCount: data.total || 0
            }
          } catch {
            return {
              ...category,
              productCount: 0
            }
          }
        })

        const categoriesWithCounts = await Promise.all(countsPromises)
        setCategoriesWithCounts(categoriesWithCounts)
      } catch (error) {
        console.error('Error al obtener conteos de productos:', error)
        setCategoriesWithCounts(categories)
      }
    }

    fetchProductCounts()
  }, [categories, customerSlug])

  // Filtrar categorías por búsqueda
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categoriesWithCounts
    }
    const searchLower = searchTerm.toLowerCase()
    return categoriesWithCounts.filter(
      (category) =>
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))
    )
  }, [categoriesWithCounts, searchTerm])

  // Calcular paginación
  const totalPages = Math.ceil(filteredCategories.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

  // Resetear página cuando cambia el término de búsqueda o el tamaño de página
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleClear = () => {
    setSearchTerm("")
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center mb-4">
          <ShoppingBag className="h-12 w-12 text-primary" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">No hay categorías registradas</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Crea una categoría para comenzar a organizar tus productos</p>
      </div>
    )
  }

  // Colores de gradiente para los cards
  const gradientColors = [
    'from-blue-500 via-blue-600 to-indigo-600',
    'from-purple-500 via-purple-600 to-pink-600',
    'from-green-500 via-emerald-600 to-teal-600',
    'from-orange-500 via-amber-600 to-yellow-600',
    'from-red-500 via-rose-600 to-pink-600',
    'from-cyan-500 via-blue-500 to-indigo-600',
    'from-violet-500 via-purple-600 to-fuchsia-600',
    'from-teal-500 via-cyan-600 to-blue-600',
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filtros */}
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Búsqueda */}
            <div className="flex-1 w-full sm:w-auto">
              <Label
                htmlFor="search-categories"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  id="search-categories"
                  placeholder="Buscar categorías por nombre o descripción..."
                  className="pl-10 pr-10 w-full rounded-full"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={handleClear}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tamaño de página */}
            <div className="w-full sm:w-[150px]">
              <Label
                htmlFor="page-size"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Datos
              </Label>
              <Select
                onValueChange={(value) => handlePageSizeChange(Number(value))}
                value={pageSize.toString()}
                defaultValue="12"
              >
                <SelectTrigger id="page-size" className="w-full rounded-full">
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 por página</SelectItem>
                  <SelectItem value="12">12 por página</SelectItem>
                  <SelectItem value="24">24 por página</SelectItem>
                  <SelectItem value="48">48 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de categorías */}
      {paginatedCategories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {paginatedCategories.map((category) => {
        const isHovered = hoveredCard === category.id
        // Usar el índice original de la categoría en el array completo para mantener el gradiente consistente
        const originalIndex = categoriesWithCounts.findIndex(c => c.id === category.id)
        const gradientColor = gradientColors[originalIndex >= 0 ? originalIndex % gradientColors.length : 0]
        const productCount = category.productCount ?? 0

        return (
          <Card
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            onMouseEnter={() => setHoveredCard(category.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group relative cursor-pointer overflow-hidden
              border-2 transition-all duration-300 ease-out
              bg-white dark:bg-[#1a1a1a]
              hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/20
              ${isHovered ? 'scale-[1.02] -translate-y-1 border-primary/50' : 'scale-100 border-gray-200 dark:border-[#2a2a2a]'}
            `}
          >
            {/* Gradient overlay */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${gradientColor} 
              opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10
              transition-opacity duration-300
            `} />

            {/* Top accent bar */}
            <div className={`
              absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColor}
              transform origin-left transition-transform duration-300
              ${isHovered ? 'scale-x-100' : 'scale-x-0'}
            `} />

            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col h-full min-h-[130px]">
                {/* Header con icono y badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-lg
                    bg-gradient-to-br ${gradientColor}
                    flex items-center justify-center
                    transition-all duration-300 shadow-lg
                    ${isHovered ? 'scale-110 rotate-3 shadow-xl' : 'scale-100 rotate-0'}
                  `}>
                    <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  
                  {productCount > 0 && (
                    <Badge 
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-xs px-2 py-0.5"
                    >
                      {productCount}
                    </Badge>
                  )}
                </div>

                {/* Contenido principal */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-snug">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Footer con información y acción */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                        <Package className="h-3 w-3" />
                        <span>{productCount} {productCount === 1 ? 'producto' : 'productos'}</span>
                      </div>
                      <div className={`
                        flex items-center gap-1 text-primary
                        transition-all duration-300
                        ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'}
                      `}>
                        <span className="text-xs font-medium">Ver</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Shine effect on hover */}
            {isHovered && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div 
                  className="absolute -inset-full top-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{
                    animation: 'shimmer 2s infinite',
                  }}
                />
              </div>
            )}
          </Card>
        )
      })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-4">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="rounded-full text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1 sm:mr-0" />
                  <span className="sm:inline">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="rounded-full text-xs sm:text-sm"
                >
                  <span className="sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4 ml-1 sm:ml-0" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-primary" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">No se encontraron categorías</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            {searchTerm ? "Intenta con otro término de búsqueda" : "No hay categorías registradas"}
          </p>
        </div>
      )}
    </div>
  )
}

