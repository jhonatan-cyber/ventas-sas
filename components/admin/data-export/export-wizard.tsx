"use client"

import { Download, Loader2, FileText, FileSpreadsheet, FileJson } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type ExportType = 'organizations' | 'users' | 'subscriptions' | 'tickets' | 'billing'
type ExportFormat = 'csv' | 'excel' | 'json'

export function ExportWizard() {
  const [type, setType] = useState<ExportType | "">("")
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [status, setStatus] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const typeLabels: Record<ExportType, string> = {
    organizations: 'Organizaciones',
    users: 'Usuarios',
    subscriptions: 'Suscripciones',
    tickets: 'Tickets de Soporte',
    billing: 'Facturación',
  }

  const formatIcons = {
    csv: FileText,
    excel: FileSpreadsheet,
    json: FileJson,
  }

  const handleExport = async () => {
    if (!type) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de exportación",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const filters: any = {}
      if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString()
      if (dateTo) filters.dateTo = new Date(dateTo).toISOString()
      if (status) filters.status = status
      if (organizationId) filters.organizationId = organizationId

      const response = await fetch('/api/administracion/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          format,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar')
      }

      // Descargar archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_${type}_${Date.now()}.${format === 'excel' ? 'xls' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Éxito",
        description: "Exportación completada",
      })

      // Reset form
      setType("")
      setDateFrom("")
      setDateTo("")
      setStatus("")
      setOrganizationId("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al exportar datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Datos</CardTitle>
        <CardDescription>
          Exporta datos del sistema en formato CSV, Excel o JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tipo de Datos</Label>
          <Select value={type} onValueChange={(value) => setType(value as ExportType)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo de datos" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Formato</Label>
          <div className="grid grid-cols-3 gap-4">
            {(['csv', 'excel', 'json'] as ExportFormat[]).map((fmt) => {
              const Icon = formatIcons[fmt]
              return (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                    format === fmt
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium uppercase">{fmt}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">Filtros (Opcional)</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {type && (type === 'subscriptions' || type === 'tickets' || type === 'billing') && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                placeholder="Ej: active, pending, completed"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
          )}

          {type && (type === 'users' || type === 'tickets' || type === 'billing') && (
            <div className="space-y-2">
              <Label>ID de Organización (Opcional)</Label>
              <Input
                placeholder="UUID de la organización"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleExport}
          disabled={!type || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
