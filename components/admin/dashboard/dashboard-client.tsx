"use client"


import {
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"

import { CustomizeWidgetsDialog } from "./widgets/customize-widgets-dialog"
import { Widget } from "./widgets/types"
import { useWidgetConfig } from "./widgets/use-widget-config"
import { DragAndDropWidgets } from "./widgets/widget-container"
import { WidgetRenderer } from "./widgets/widget-renderer"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  organizations: {
    total: number
    active: number
    suspended: number
  }
  users: {
    total: number
  }
  revenue: {
    total: number
  }
}

interface SystemMetrics {
  totalProducts: number
  totalOrders: number
  totalUsers: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  createdAt: string
  userId?: string
  organizationId?: string
}

interface HealthMetrics {
  uptime: number // Porcentaje
  averageLatency: number // En ms
  errorRate: number // Porcentaje
  lastCheck: string
}

interface AlertItem {
  id: string
  type: "warning" | "error" | "info"
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
}

interface DashboardClientProps {
  initialStats: DashboardStats
  initialMetrics: SystemMetrics
  initialActivity: RecentActivity[]
  initialHealth?: HealthMetrics
}

type PeriodFilter = "7d" | "30d" | "90d" | "1y" | "all"

export function DashboardClient({
  initialStats,
  initialMetrics: _initialMetrics,
  initialActivity,
  initialHealth,
}: DashboardClientProps) {
  const [period, setPeriod] = useState<PeriodFilter>("30d")
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [health, setHealth] = useState<HealthMetrics | null>(initialHealth || null)
  const [activity, setActivity] = useState<RecentActivity[]>(initialActivity)
  const [refreshing, setRefreshing] = useState(false)
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [recentSubscriptions, setRecentSubscriptions] = useState<any[]>([])
  
  const { widgets, isLoading: widgetsLoading, saveWidgets, updateWidget, removeWidget } = useWidgetConfig()

  useEffect(() => {
    fetchAlerts()
    fetchHealthMetrics()
    fetchRecentSubscriptions()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/administracion/dashboard/alerts")
      const data = await response.json()
      if (data.success) {
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error("Error fetching alerts:", error)
    }
  }

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch("/api/administracion/dashboard/health")
      const data = await response.json()
      if (data.success) {
        setHealth(data.health)
      }
    } catch (error) {
      console.error("Error fetching health metrics:", error)
    }
  }

  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch(`/api/administracion/dashboard/activity?period=${period}`)
      const data = await response.json()
      if (data.success) {
        setActivity(data.activity || [])
      }
    } catch (error) {
      console.error("Error fetching activity:", error)
    }
  }, [period])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const fetchRecentSubscriptions = async () => {
    try {
      const response = await fetch("/api/administracion/dashboard/recent-subscriptions")
      const data = await response.json()
      if (data.success) {
        setRecentSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error("Error fetching recent subscriptions:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchAlerts(),
      fetchHealthMetrics(),
      fetchActivity(),
      fetchRecentSubscriptions(),
    ])
    setRefreshing(false)
  }

  const getWidgetData = (widget: Widget) => {
    switch (widget.type) {
      case "stats":
        return initialStats
      case "health":
        return health
      case "activity":
        return activity
      case "recent-subscriptions":
        return recentSubscriptions
      default:
        return null
    }
  }

  const handleSizeChange = (id: string, size: Widget['size']) => {
    updateWidget(id, { size })
  }

  const handleRemoveWidget = (id: string) => {
    removeWidget(id)
  }

  const getPeriodLabel = (p: PeriodFilter) => {
    const labels: Record<PeriodFilter, string> = {
      "7d": "7 días",
      "30d": "30 días",
      "90d": "90 días",
      "1y": "1 año",
      all: "Todo",
    }
    return labels[p]
  }

  if (widgetsLoading) {
    return <div>Cargando widgets...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filtros rápidos y controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["7d", "30d", "90d", "1y", "all"] as PeriodFilter[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {getPeriodLabel(p)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizeOpen(true)}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Personalizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas destacadas */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.type === "error" ? "destructive" : alert.type === "warning" ? "default" : "default"}
              className={
                alert.type === "warning"
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : alert.type === "error"
                  ? "border-red-500"
                  : ""
              }
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                {alert.actionUrl && (
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-4"
                    onClick={() => window.location.href = alert.actionUrl!}
                  >
                    {alert.actionLabel || "Ver"}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Widgets con drag and drop */}
      <DragAndDropWidgets
        widgets={widgets}
        onWidgetsChange={saveWidgets}
        onRemove={handleRemoveWidget}
        onSizeChange={handleSizeChange}
        columns={4}
      >
        {(widget) => {
          const data = getWidgetData(widget)
          if (!data) return null
          return <WidgetRenderer widget={widget} data={data} />
        }}
      </DragAndDropWidgets>

      {/* Diálogo de personalización */}
      <CustomizeWidgetsDialog
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        widgets={widgets}
        onSave={saveWidgets}
      />
    </div>
  )
}
