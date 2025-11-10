/**
 * Lazy imports para componentes pesados
 * 
 * Este archivo centraliza los lazy imports para facilitar
 * la gestión y el mantenimiento del código splitting
 */

import React, { lazy } from 'react'

import type { ComponentType, ReactNode } from 'react'

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
const defaultFallback = React.createElement(
  'div',
  { className: 'flex items-center justify-center p-8' },
  React.createElement('div', {
    className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900',
  })
)

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return {
    Component: LazyComponent,
    fallback: fallback ?? defaultFallback,
  }
}

