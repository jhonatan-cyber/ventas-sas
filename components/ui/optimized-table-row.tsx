"use client"

import { memo, ReactNode } from 'react'

import { TableRow } from '@/components/ui/table'

interface OptimizedTableRowProps {
  children: ReactNode
  className?: string
  id: string | number
}

/**
 * Componente de fila de tabla optimizado que evita re-renders innecesarios
 * Usa React.memo con comparación personalizada para mejor rendimiento
 */
export const OptimizedTableRow = memo(function OptimizedTableRow({
  children,
  className,
  id: _id
}: OptimizedTableRowProps) {
  return (
    <TableRow className={className}>
      {children}
    </TableRow>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.id === nextProps.id &&
    prevProps.className === nextProps.className &&
    prevProps.children === nextProps.children
  )
})

OptimizedTableRow.displayName = "OptimizedTableRow"