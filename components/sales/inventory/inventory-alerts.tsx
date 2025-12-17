/**
 * Componente para mostrar alertas de stock bajo
 */

"use client"

import { AlertTriangle, Package } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface LowStockAlert {
  productId: string
  productName: string
  currentStock: number
  minStock: number
  reorderPoint: number | null
  branchId?: string | null
  branchName?: string | null
  organizationId: string
}

interface InventoryAlertsProps {
  customerSlug: string
}

export function InventoryAlerts({ customerSlug }: InventoryAlertsProps) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/inventory/alerts`)
      const data = await response.json()

      if (data.success) {
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error("Error cargando alertas:", error)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas de Stock Bajo
          </CardTitle>
          <CardDescription>
            Productos con stock bajo o en punto de reorden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Alertas de Stock Bajo
          </CardTitle>
          <CardDescription>
            Productos con stock bajo o en punto de reorden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay alertas de stock bajo
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>
              Productos con stock bajo o en punto de reorden
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-sm">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.productId}
              className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {alert.productName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {alert.branchName && (
                    <span className="mr-2">{alert.branchName}</span>
                  )}
                  <span>
                    Stock actual: <strong>{alert.currentStock}</strong>
                  </span>
                  {alert.reorderPoint !== null && (
                    <span className="ml-2">
                      Punto de reorden: <strong>{alert.reorderPoint}</strong>
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4 text-right">
                <Badge
                  variant={alert.currentStock <= alert.minStock ? "destructive" : "default"}
                  className="text-xs"
                >
                  {alert.currentStock <= alert.minStock
                    ? 'Bajo mínimo'
                    : 'En reorden'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            className="w-full rounded-full"
          >
            Actualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

