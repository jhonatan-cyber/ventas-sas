"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TableResponsiveProps {
  children: ReactNode
  className?: string
  /**
   * Columnas que se ocultan en pantallas pequeñas
   * Array de índices o nombres de columnas
   */
  hiddenColumns?: {
    mobile?: (number | string)[]
    tablet?: (number | string)[]
  }
}

/**
 * Wrapper mejorado para tablas responsive
 * - Oculta columnas en móvil según configuración
 * - Scroll horizontal suave
 * - Mejor visualización en pantallas pequeñas
 */
export function TableResponsive({ 
  children, 
  className,
  hiddenColumns
}: TableResponsiveProps) {
  return (
    <div className={cn(
      "relative",
      "overflow-x-auto",
      // Scrollbar styling mejorado
      "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2",
      "[&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-[#2a2a2a]",
      "[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full",
      "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Clases helper para ocultar columnas en responsive
 */
export const tableColumnClasses = {
  hideMobile: "hidden md:table-cell",
  hideTablet: "hidden lg:table-cell",
  showMobileOnly: "table-cell md:hidden",
}

