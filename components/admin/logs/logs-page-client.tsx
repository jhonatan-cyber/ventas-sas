"use client"

import { Download, RefreshCw, AlertTriangle } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { LogDetailDialog } from "./log-detail-dialog"
import { LogsFilters } from "./logs-filters"
import { LogsTable } from "./logs-table"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityLogWithUser, SecurityLogStats, SecurityLogFilters } from "@/lib/services/admin/security-logs-service"


interface LogsPageClientProps {
  initialLogs: SecurityLogWithUser[]
  initialTotal: number
  initialStats: SecurityLogStats
}

export function LogsPageClient({
  initialLogs,
  initialTotal,
  initialStats,
}: LogsPageClientProps) {
  const [logs, setLogs] = useState<SecurityLogWithUser[]>(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState<SecurityLogStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SecurityLogWithUser | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filters, setFilters] = useState<SecurityLogFilters>({
    type: undefined,
    userId: undefined,
    organizationId: undefined,
    customerId: undefined,
    ipAddress: undefined,
    success: undefined,
    startDate: undefined,
    endDate: undefined,
    search: "",
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Cargar logs con filtros
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())
      params.set("includeStats", "true")

      if (filters.type) {
        if (Array.isArray(filters.type)) {
          params.set("type", filters.type.join(","))
        } else {
          params.set("type", filters.type)
        }
      }
      if (filters.userId) params.set("userId", filters.userId)
      if (filters.organizationId) params.set("organizationId", filters.organizationId)
      if (filters.customerId) params.set("customerId", filters.customerId)
      if (filters.ipAddress) params.set("ipAddress", filters.ipAddress)
      if (filters.success !== undefined) params.set("success", filters.success.toString())
      if (filters.startDate) params.set("startDate", filters.startDate.toISOString())
      if (filters.endDate) params.set("endDate", filters.endDate.toISOString())
      if (filters.search) params.set("search", filters.search)

      const response = await fetch(`/api/administracion/logs?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
        setTotal(data.pagination.total)
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  // Exportar logs
  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await fetch("/api/administracion/logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          filters,
        }),
      })

      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `security-logs-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.logs, null, 2)], {
          type: "application/json",
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `security-logs-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  const handleLogClick = (log: SecurityLogWithUser) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Eventos Exitosos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.bySuccess.find((s) => s.success)?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Eventos Fallidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.bySuccess.find((s) => !s.success)?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Eventos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.criticalEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Día</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.byDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Tipo</CardTitle>
            <CardDescription>Top 10 tipos más frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.byType.slice(0, 10).sort((a, b) => b.count - a.count)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Logs de Seguridad</CardTitle>
              <CardDescription>
                {total} evento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LogsFilters
            filters={filters}
            onFiltersChange={setFilters}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            pageSize={pageSize}
          />

          {stats.criticalEvents > 0 && (
            <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                Hay {stats.criticalEvents} evento{stats.criticalEvents !== 1 ? "s" : ""} crítico
                {stats.criticalEvents !== 1 ? "s" : ""} que requieren atención.
              </AlertDescription>
            </Alert>
          )}

          <LogsTable
            logs={logs}
            loading={loading}
            onLogClick={handleLogClick}
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Diálogo de detalles */}
      {selectedLog && (
        <LogDetailDialog
          log={selectedLog}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </div>
  )
}
