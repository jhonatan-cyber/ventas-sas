"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTableWrapperProps {
  children: ReactNode
  className?: string
  mobileView?: "scroll" | "cards"
}

/**
 * Wrapper para tablas que mejora el responsive
 * - En móvil: muestra scroll horizontal o convierte a cards
 * - En desktop: muestra tabla normal
 */
export function ResponsiveTableWrapper({ 
  children, 
  className,
  mobileView = "scroll"
}: ResponsiveTableWrapperProps) {
  if (mobileView === "cards") {
    return (
      <div className={cn("block md:hidden", className)}>
        {/* Vista de cards para móvil - se implementaría con un componente específico */}
        {children}
      </div>
    )
  }

  // Vista de scroll horizontal (por defecto)
  return (
    <div className={cn(
      "overflow-x-auto",
      // Scrollbar styling para mejor UX
      "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
      "scrollbar-track-transparent",
      className
    )}>
      <div className="min-w-full inline-block align-top">
        {children}
      </div>
    </div>
  )
}

