"use client"

import { useState, useEffect } from "react"
import { AdminGrowthChart } from "./admin-growth-chart"

export function AdminAnalyticsClient() {
  const [days, setDays] = useState(90)
  const [growthData, setGrowthData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/administracion/analytics?type=growth&days=${days}`)
        const data = await res.json()
        setGrowthData(data.data || [])
      } catch (error) {
        console.error('Error fetching admin analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [days])

  if (loading) {
    return (
      <div className="h-[300px] bg-gray-100 dark:bg-[#2a2a2a] animate-pulse rounded-lg" />
    )
  }

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <h2 className="text-md md:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
          Analytics del Sistema
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border rounded-lg bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] shrink-0"
        >
          <option value={30}>Últimos 30 días</option>
          <option value={60}>Últimos 60 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={180}>Últimos 6 meses</option>
          <option value={365}>Último año</option>
        </select>
      </div>
      <AdminGrowthChart data={growthData} />
    </div>
  )
}

