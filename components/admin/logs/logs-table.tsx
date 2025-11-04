"use client"

import { SecurityLogWithUser } from "@/lib/services/admin/security-logs-service"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface LogsTableProps {
  logs: SecurityLogWithUser[]
  loading: boolean
  onLogClick: (log: SecurityLogWithUser) => void
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

const getLogTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    LOGIN_ATTEMPT: "Intento de Login",
    LOGIN_SUCCESS: "Login Exitoso",
    LOGIN_FAILED: "Login Fallido",
    LOGOUT: "Logout",
    PASSWORD_CHANGE: "Cambio de Contraseña",
    PASSWORD_RESET: "Reset de Contraseña",
    USER_CREATED: "Usuario Creado",
    USER_UPDATED: "Usuario Actualizado",
    USER_DELETED: "Usuario Eliminado",
    USER_ACTIVATED: "Usuario Activado",
    USER_DEACTIVATED: "Usuario Desactivado",
    ROLE_CHANGED: "Rol Cambiado",
    UNAUTHORIZED_ACCESS_ATTEMPT: "Acceso No Autorizado",
    RATE_LIMIT_EXCEEDED: "Rate Limit Excedido",
    SENSITIVE_DATA_ACCESSED: "Datos Sensibles",
    SETTINGS_CHANGED: "Configuración Cambiada",
  }
  return labels[type] || type
}

const getLogTypeColor = (type: string): string => {
  if (type.includes("SUCCESS")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  if (type.includes("FAILED") || type.includes("UNAUTHORIZED")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  if (type.includes("ATTEMPT")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
}

const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d)
}

export function LogsTable({
  logs,
  loading,
  onLogClick,
  page,
  total,
  pageSize,
  onPageChange,
}: LogsTableProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando logs...</p>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No se encontraron logs con los filtros seleccionados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                <TableCell className="text-sm">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge className={getLogTypeColor(log.type)}>
                    {getLogTypeLabel(log.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <div className="font-medium">{log.user.email}</div>
                      {log.user.fullName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {log.user.fullName}
                        </div>
                      )}
                    </div>
                  ) : log.userId ? (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{log.userId.slice(0, 8)}...</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.ipAddress ? (
                    <code className="text-xs bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                      {log.ipAddress}
                    </code>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.success ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exitoso
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Fallido
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLogClick(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) onPageChange(page - 1)
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNum}
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(pageNum)
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) onPageChange(page + 1)
                  }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total} logs
      </div>
    </div>
  )
}
