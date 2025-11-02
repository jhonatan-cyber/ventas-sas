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
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
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

