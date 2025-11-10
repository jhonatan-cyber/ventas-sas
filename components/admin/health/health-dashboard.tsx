"use client"

import { Server, Database, HardDrive, AlertTriangle, Zap, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface HealthMetrics {
  server: {
    uptime: number
    uptimeFormatted: string
    cpuUsage: number
    memoryUsage: number
    memoryTotal: number
    memoryUsed: number
    memoryFree: number
  }
  database: {
    connected: boolean
    latency: number
    queryTime: number
    slowQueries: number
    connectionPool: {
      active: number
      idle: number
    }
  }
  disk: {
    total: number
    used: number
    free: number
    usage: number
  }
  errors: {
    last24h: number
    last7d: number
    byEndpoint: Array<{ endpoint: string; count: number }>
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    requestsPerMinute: number
  }
}

export function HealthDashboard() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/administracion/health/metrics')
      const data = await response.json()
      if (data.success) {
        setMetrics(data.metrics)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No se pudieron cargar las métricas
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return "text-green-600 dark:text-green-400"
    if (value <= thresholds.warning) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Salud del Sistema</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Servidor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Servidor
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Uptime</p>
            <p className="text-2xl font-bold">{metrics.server.uptimeFormatted}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">CPU</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getStatusColor(metrics.server.cpuUsage, { good: 50, warning: 80 })}`}>
                {metrics.server.cpuUsage}%
              </p>
            </div>
            <Progress value={metrics.server.cpuUsage} className="mt-2" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Memoria</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getStatusColor(metrics.server.memoryUsage, { good: 70, warning: 90 })}`}>
                {metrics.server.memoryUsage.toFixed(1)}%
              </p>
            </div>
            <Progress value={metrics.server.memoryUsage} className="mt-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {metrics.server.memoryUsed.toFixed(2)} GB / {metrics.server.memoryTotal.toFixed(2)} GB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Base de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estado</p>
            <Badge variant={metrics.database.connected ? "default" : "destructive"}>
              {metrics.database.connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Latencia</p>
            <p className={`text-2xl font-bold ${getStatusColor(metrics.database.latency, { good: 50, warning: 100 })}`}>
              {metrics.database.latency}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tiempo de Query</p>
            <p className={`text-2xl font-bold ${getStatusColor(metrics.database.queryTime, { good: 100, warning: 500 })}`}>
              {metrics.database.queryTime}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Queries Lentas</p>
            <p className="text-2xl font-bold">{metrics.database.slowQueries}</p>
          </div>
        </CardContent>
      </Card>

      {/* Disco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Disco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Uso</span>
              <span className={`font-bold ${getStatusColor(metrics.disk.usage, { good: 70, warning: 90 })}`}>
                {metrics.disk.usage}%
              </span>
            </div>
            <Progress value={metrics.disk.usage} />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Libre: {metrics.disk.free.toFixed(2)} GB</span>
              <span>Usado: {metrics.disk.used.toFixed(2)} GB / {metrics.disk.total.toFixed(2)} GB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errores y Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Errores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Últimas 24 horas</p>
              <p className="text-2xl font-bold">{metrics.errors.last24h}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Últimos 7 días</p>
              <p className="text-2xl font-bold">{metrics.errors.last7d}</p>
            </div>
            {metrics.errors.byEndpoint.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Por Endpoint</p>
                <div className="space-y-1">
                  {metrics.errors.byEndpoint.slice(0, 5).map((item) => (
                    <div key={item.endpoint} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">{item.endpoint}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tiempo Promedio</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.performance.avgResponseTime, { good: 200, warning: 500 })}`}>
                {metrics.performance.avgResponseTime}ms
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">P95</p>
              <p className="text-2xl font-bold">{metrics.performance.p95ResponseTime}ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">P99</p>
              <p className="text-2xl font-bold">{metrics.performance.p99ResponseTime}ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Requests/Minuto</p>
              <p className="text-2xl font-bold">{metrics.performance.requestsPerMinute}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
