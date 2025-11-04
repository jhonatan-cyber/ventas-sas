"use client"

import { useState } from "react"
import { Search, Calendar, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SecurityLogFilters } from "@/lib/services/admin/security-logs-service"
import { SecurityLogType } from "@/lib/utils/security-audit"

interface LogsFiltersProps {
  filters: SecurityLogFilters
  onFiltersChange: (filters: SecurityLogFilters) => void
  onPageSizeChange: (size: number) => void
  pageSize: number
}

const LOG_TYPES: { value: SecurityLogType; label: string }[] = [
  { value: "LOGIN_ATTEMPT", label: "Intento de Login" },
  { value: "LOGIN_SUCCESS", label: "Login Exitoso" },
  { value: "LOGIN_FAILED", label: "Login Fallido" },
  { value: "LOGOUT", label: "Logout" },
  { value: "PASSWORD_CHANGE", label: "Cambio de Contraseña" },
  { value: "PASSWORD_RESET", label: "Reset de Contraseña" },
  { value: "USER_CREATED", label: "Usuario Creado" },
  { value: "USER_UPDATED", label: "Usuario Actualizado" },
  { value: "USER_DELETED", label: "Usuario Eliminado" },
  { value: "UNAUTHORIZED_ACCESS_ATTEMPT", label: "Intento de Acceso No Autorizado" },
  { value: "RATE_LIMIT_EXCEEDED", label: "Límite de Rate Excedido" },
  { value: "SENSITIVE_DATA_ACCESSED", label: "Acceso a Datos Sensibles" },
  { value: "SETTINGS_CHANGED", label: "Configuración Cambiada" },
]

export function LogsFilters({
  filters,
  onFiltersChange,
  onPageSizeChange,
  pageSize,
}: LogsFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "")
  const [localFilters, setLocalFilters] = useState(filters)

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      type: undefined,
      userId: undefined,
      organizationId: undefined,
      customerId: undefined,
      ipAddress: undefined,
      success: undefined,
      startDate: undefined,
      endDate: undefined,
      search: "",
    }
    setLocalFilters(clearedFilters)
    setSearchTerm("")
    onFiltersChange(clearedFilters)
  }

  const handleSearch = () => {
    handleFilterChange("search", searchTerm)
  }

  const hasActiveFilters =
    localFilters.type ||
    localFilters.userId ||
    localFilters.organizationId ||
    localFilters.customerId ||
    localFilters.ipAddress ||
    localFilters.success !== undefined ||
    localFilters.startDate ||
    localFilters.endDate ||
    searchTerm

  return (
    <div className="space-y-4">
      {/* Búsqueda principal */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar en logs (mensajes, detalles, errores)..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
        </div>
        <Button onClick={handleSearch} size="default">
          Buscar
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Filtros avanzados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tipo de evento */}
        <div>
          <Label htmlFor="type">Tipo de Evento</Label>
          <Select
            value={
              Array.isArray(localFilters.type)
                ? "multiple"
                : (localFilters.type || "all")
            }
            onValueChange={(value) => {
              if (value === "all") {
                handleFilterChange("type", undefined)
              } else {
                handleFilterChange("type", value as SecurityLogType)
              }
            }}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {LOG_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Éxito/Fallo */}
        <div>
          <Label htmlFor="success">Estado</Label>
          <Select
            value={
              localFilters.success === undefined
                ? "all"
                : localFilters.success
                ? "success"
                : "failed"
            }
            onValueChange={(value) => {
              if (value === "all") {
                handleFilterChange("success", undefined)
              } else {
                handleFilterChange("success", value === "success")
              }
            }}
          >
            <SelectTrigger id="success">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Exitosos</SelectItem>
              <SelectItem value="failed">Fallidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha desde */}
        <div>
          <Label htmlFor="startDate">Desde</Label>
          <Input
            id="startDate"
            type="date"
            value={
              localFilters.startDate
                ? new Date(localFilters.startDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : undefined
              handleFilterChange("startDate", date)
            }}
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <Label htmlFor="endDate">Hasta</Label>
          <Input
            id="endDate"
            type="date"
            value={
              localFilters.endDate
                ? new Date(localFilters.endDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : undefined
              handleFilterChange("endDate", date)
            }}
          />
        </div>

        {/* IP Address */}
        <div>
          <Label htmlFor="ipAddress">Dirección IP</Label>
          <Input
            id="ipAddress"
            type="text"
            placeholder="192.168.1.1"
            value={localFilters.ipAddress || ""}
            onChange={(e) => handleFilterChange("ipAddress", e.target.value || undefined)}
          />
        </div>

        {/* Usuario ID */}
        <div>
          <Label htmlFor="userId">ID de Usuario</Label>
          <Input
            id="userId"
            type="text"
            placeholder="UUID del usuario"
            value={localFilters.userId || ""}
            onChange={(e) => handleFilterChange("userId", e.target.value || undefined)}
          />
        </div>

        {/* Organización ID */}
        <div>
          <Label htmlFor="organizationId">ID de Organización</Label>
          <Input
            id="organizationId"
            type="text"
            placeholder="UUID de organización"
            value={localFilters.organizationId || ""}
            onChange={(e) =>
              handleFilterChange("organizationId", e.target.value || undefined)
            }
          />
        </div>

        {/* Tamaño de página */}
        <div>
          <Label htmlFor="pageSize">Por página</Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger id="pageSize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
