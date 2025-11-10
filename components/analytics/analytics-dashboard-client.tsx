"use client"

import { TrendingUp, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"

import { ComparisonCard } from "./comparison-card"
import { PeriodFilter } from "./period-filter"
import { ProductsChart } from "./products-chart"
import { QuotationChart } from "./quotation-chart"
import { RevenueChart } from "./revenue-chart"
import { SalesChart } from "./sales-chart"

interface AnalyticsDashboardClientProps {
  slug: string
}

export function AnalyticsDashboardClient({ slug }: AnalyticsDashboardClientProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [days, setDays] = useState(30)
  const [salesData, setSalesData] = useState<any[]>([])
  const [productsData, setProductsData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [quotationsData, setQuotationsData] = useState<any[]>([])
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <PeriodFilter period={period} onPeriodChange={setPeriod} />
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={60}>Últimos 60 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      {/* Comparación con período anterior */}
      {comparison && (
        <div className="grid gap-4 md:grid-cols-2">
          <ComparisonCard
            title="Ventas"
            current={comparison.sales.current}
            previous={comparison.sales.previous}
            format="number"
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          />
          <ComparisonCard
            title="Ingresos"
            current={comparison.revenue.current}
            previous={comparison.revenue.previous}
            format="currency"
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
          />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart data={salesData} period={period} />
        <ProductsChart data={productsData} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart data={revenueData} />
        <QuotationChart data={quotationsData} />
      </div>
    </div>
  )
}

