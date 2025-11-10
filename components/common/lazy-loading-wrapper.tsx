/**
 * Wrapper para componentes lazy con Suspense
 * Proporciona un fallback consistente
 */

"use client"

import { Loader2 } from 'lucide-react'
import { Suspense, ReactNode } from 'react'

interface LazyLoadingWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function LazyLoadingWrapper({ children, fallback }: LazyLoadingWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

