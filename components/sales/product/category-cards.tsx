"use client"

import { Category } from "@prisma/client"
import { ShoppingBag, ChevronRight, Package } from "lucide-react"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {categoriesWithCounts.map((category, index) => {
        const isHovered = hoveredCard === category.id
        const gradientColor = gradientColors[index % gradientColors.length]
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
  )
}

