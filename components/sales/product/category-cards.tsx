"use client"

import { useState } from "react"
import { Category } from "@prisma/client"
import { ShoppingBag, ChevronRight } from "lucide-react"

interface CategoryCardsProps {
  categories: Category[]
  onCategorySelect: (categoryId: string) => void
}

export function CategoryCards({ categories, onCategorySelect }: CategoryCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const gradientBackground = 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 90%, white) 0%, var(--primary) 50%, color-mix(in oklch, var(--primary) 75%, black) 100%)'
  const glowGradient = 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 60%, transparent) 0%, color-mix(in oklch, var(--primary) 85%, white) 45%, color-mix(in oklch, var(--primary) 70%, transparent) 100%)'
  const hoverShadow = '0 24px 48px -24px color-mix(in oklch, var(--primary) 65%, black)'
  const baseShadow = '0 16px 36px -24px rgba(0,0,0,0.4)'
  const borderColor = 'color-mix(in oklch, var(--primary) 55%, white)'
  const iconBackground = 'color-mix(in oklch, var(--primary) 55%, white)'
  const iconBorder = 'color-mix(in oklch, var(--primary) 35%, white)'
  const chevronBackground = 'color-mix(in oklch, var(--primary) 45%, white)'
  const accentLineColor = 'color-mix(in oklch, var(--primary) 80%, white)'

  const shineGradient = 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 30%, white) 0%, color-mix(in oklch, var(--primary) 20%, transparent) 50%, transparent 100%)'

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No hay categorías registradas</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Crea una categoría para comenzar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => {
        const isHovered = hoveredCard === category.id

        return (
          <div
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            onMouseEnter={() => setHoveredCard(category.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative cursor-pointer"
          >
            {/* Glow effect on hover */}
            {isHovered && (
              <div 
                className="absolute -inset-2 rounded-2xl blur-xl opacity-75 transition-all duration-500"
                style={{ background: glowGradient }}
              />
            )}

            {/* Card container with 3D effect */}
            <div
              className={`
                relative w-full h-44 rounded-2xl overflow-hidden border-2
                transition-all duration-500 ease-out
                ${isHovered ? 'transform scale-[1.03] -translate-y-2' : 'transform scale-100'}
              `}
              style={{
                perspective: '600px',
                background: gradientBackground,
                borderColor: isHovered ? borderColor : 'transparent',
                boxShadow: isHovered ? hoverShadow : baseShadow,
              }}
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent" />
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, white 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, white 0%, transparent 50%),
                      radial-gradient(circle at 40% 60%, white 0%, transparent 40%)
                    `,
                  }}
                />
              </div>

              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                }}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col p-5 justify-between">
                {/* Top section with icon */}
                <div className="flex items-start justify-between">
                  <div className={`
                    w-14 h-14 rounded-2xl backdrop-blur-sm
                    flex items-center justify-center
                    transition-all duration-500
                    ${isHovered ? 'scale-110 rotate-6 shadow-lg' : 'scale-100 rotate-0'}
                    border
                  `}
                  style={{
                    background: iconBackground,
                    borderColor: iconBorder,
                  }}>
                    <ShoppingBag className="h-7 w-7 text-white drop-shadow-lg" />
                  </div>
                  
                  {/* Chevron indicator */}
                  <div className={`
                    w-8 h-8 rounded-full backdrop-blur-sm
                    flex items-center justify-center
                    transition-all duration-500
                    ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
                  `}
                  style={{ background: chevronBackground }}>
                    <ChevronRight className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Category info */}
                <div className="space-y-1.5">
                  <h3 className="text-white text-xl font-semibold drop-shadow-lg">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-white/90 text-xs line-clamp-2 leading-snug">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Bottom accent line */}
                <div className="flex items-center gap-2">
                  <div 
                    className="h-[3px] rounded-full transition-all duration-500"
                    style={{
                      background: accentLineColor,
                      width: isHovered ? '100%' : '2.5rem'
                    }}
                  />
                  <div className={`
                    w-2 h-2 rounded-full bg-white
                    transition-all duration-500
                    ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                  `} />
                </div>
              </div>

              {/* Shine effect on hover */}
              {isHovered && (
                <div 
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                >
                  <div 
                    className="absolute inset-0 animate-pulse"
                    style={{ background: shineGradient }}
                  />
                </div>
              )}

              {/* Corner decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full backdrop-blur-sm" />
            </div>

            {/* Hover pulse ring */}
            {isHovered && (
              <div 
                className="absolute inset-0 rounded-3xl border-2 transition-all duration-700 animate-ping"
                style={{
                  borderColor,
                  animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

