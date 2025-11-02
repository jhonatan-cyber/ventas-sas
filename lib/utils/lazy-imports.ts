/**
 * Lazy imports para componentes pesados
 * 
 * Este archivo centraliza los lazy imports para facilitar
 * la gestión y el mantenimiento del código splitting
 */

import { lazy } from 'react'

/**
 * Lazy imports de páginas de reportes
 * Estas páginas suelen ser pesadas por los gráficos y análisis
 */
export const ReportesPages = {
  General: lazy(() => import('@/app/[slug]/reportes/general/page')),
  Sales: lazy(() => import('@/app/[slug]/reportes/sales/page')),
  Products: lazy(() => import('@/app/[slug]/reportes/products/page')),
  Expenses: lazy(() => import('@/app/[slug]/reportes/expenses/page')),
  Customers: lazy(() => import('@/app/[slug]/reportes/customers/page')),
  CashRegisters: lazy(() => import('@/app/[slug]/reportes/cash-registers/page')),
}

/**
 * Lazy imports de dashboards
 * Los dashboards suelen tener múltiples widgets y gráficos
 */
export const DashboardPages = {
  SalesDashboard: lazy(() => import('@/app/[slug]/dashboard/page')),
  AdminDashboard: lazy(() => import('@/app/administracion/dashboard/page')),
}

/**
 * Helper para crear un componente lazy con fallback
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return {
    Component: LazyComponent,
    fallback: fallback || <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>,
  }
}

