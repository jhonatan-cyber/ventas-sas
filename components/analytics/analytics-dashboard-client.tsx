"use client"

import { TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"

import { ComparisonCard } from "./comparison-card"
import { PeriodFilter } from "./period-filter"
import { ProductsChart } from "./products-chart"
import { QuotationChart } from "./quotation-chart"
import { RevenueChart } from "./revenue-chart"
import { SalesChart } from "./sales-chart"

import { Badge } from "@/components/ui/badge"

interface AnalyticsDashboardClientProps {
  slug: string
  maxBranches?: number | null
}

export function AnalyticsDashboardClient({ slug, maxBranches }: AnalyticsDashboardClientProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [days, setDays] = useState(30)
  const [salesData, setSalesData] = useState<any[]>([])
  const [productsData, setProductsData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [quotationsData, setQuotationsData] = useState<any[]>([])
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Determinar si mostrar widgets avanzados (más de una sucursal permitida)
  const isAdvanced = (maxBranches ?? 1) > 1

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const [salesRes, productsRes, revenueRes, quotationsRes, comparisonRes] = await Promise.all([
          fetch(`/api/${slug}/analytics?type=sales&period=${period}&days=${days}`),
          fetch(`/api/${slug}/analytics?type=products&limit=10`),
          fetch(`/api/${slug}/analytics?type=revenue&days=${days}`),
          fetch(`/api/${slug}/analytics?type=quotations&days=${days}`),
          fetch(`/api/${slug}/analytics?type=comparison&days=${days}`),
        ])

        const [sales, products, revenue, quotations, comparisonData] = await Promise.all([
          salesRes.json(),
          productsRes.json(),
          revenueRes.json(),
          quotationsRes.json(),
          comparisonRes.json(),
        ])

        setSalesData(sales.data || [])
        setProductsData(products.data || [])
        setRevenueData(revenue.data || [])
        setQuotationsData(quotations.data || [])
        setComparison(comparisonData.data || null)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [slug, period, days])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[300px] bg-gray-100 dark:bg-[#2a2a2a] animate-pulse rounded-lg" />
        <div className="h-[300px] bg-gray-100 dark:bg-[#2a2a2a] animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:justify-between">
        <div className="w-full sm:w-auto">
          <PeriodFilter period={period} onPeriodChange={setPeriod} />
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-sm"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={60}>Últimos 60 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      {/* Widgets Básicos */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Métricas Básicas
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
        </div>

        {/* Comparación con período anterior */}
        {comparison && 
         comparison.sales && 
         comparison.revenue && 
         typeof comparison.sales.current !== 'undefined' && 
         typeof comparison.revenue.current !== 'undefined' && (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <ComparisonCard
              title="Ventas"
              current={comparison.sales.current || 0}
              previous={comparison.sales.previous || 0}
              format="number"
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              slug={slug}
            />
            <ComparisonCard
              title="Ingresos"
              current={comparison.revenue.current || 0}
              previous={comparison.revenue.previous || 0}
              format="currency"
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              slug={slug}
            />
          </div>
        )}

        {/* Gráficos Básicos */}
        <div className="grid gap-4 md:grid-cols-2">
          <SalesChart data={salesData} period={period} slug={slug} />
          <ProductsChart data={productsData} slug={slug} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <RevenueChart data={revenueData} slug={slug} />
        </div>
      </div>

      {/* Widgets Avanzados - Solo si tiene más de una sucursal */}
      {isAdvanced && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Métricas Avanzadas
              <Badge variant="outline" className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">
                Múltiples Sucursales
              </Badge>
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <QuotationChart data={quotationsData} slug={slug} />
          </div>
        </div>
      )}
    </div>
  )
}

