"use client"

import { CheckCircle, XCircle, Calendar, User, Globe, Building, UserCircle, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SecurityLogWithUser } from "@/lib/services/admin/security-logs-service"


interface LogDetailDialogProps {
  log: SecurityLogWithUser
  open: boolean
  onOpenChange: (open: boolean) => void
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

const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(d)
}

export function LogDetailDialog({ log, open, onOpenChange }: LogDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalles del Log de Seguridad
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
          </DialogTitle>
          <DialogDescription>
            Información completa del evento de seguridad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información básica */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">ID del Log</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{log.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Tipo de Evento</label>
                <div className="mt-1">
                  <Badge variant="outline">{getLogTypeLabel(log.type)}</Badge>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Fecha y Hora
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(log.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Estado</label>
                <div className="mt-1">
                  {log.success ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Exitoso
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Fallido
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del usuario */}
          {log.user || log.userId ? (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Usuario
                </h3>
                {log.user ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{log.user.email}</p>
                    </div>
                    {log.user.fullName && (
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Nombre</label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {log.user.fullName}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">ID</label>
                      <p className="text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{log.user.id}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">ID de Usuario</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{log.userId}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          ) : null}

          {/* Organización */}
          {log.organization ? (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Organización
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Nombre</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{log.organization.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Slug</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">{log.organization.slug}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">ID</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{log.organization.id}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          ) : null}

          {/* Cliente */}
          {log.customer ? (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <UserCircle className="h-4 w-4" />
                  Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {(log.customer.razonSocial || log.customer.nombre) && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Nombre</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {log.customer.razonSocial || `${log.customer.nombre || ""} ${log.customer.apellido || ""}`.trim()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">ID</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{log.customer.id}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          ) : null}

          {/* Información de red */}
          {log.ipAddress || log.userAgent ? (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Información de Red
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {log.ipAddress && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Dirección IP</label>
                      <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">{log.ipAddress}</p>
                    </div>
                  )}
                  {log.userAgent && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">User Agent</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{log.userAgent}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          ) : null}

          {/* Mensaje de error */}
          {log.errorMessage && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Mensaje de Error
                </h3>
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap break-words">
                    {log.errorMessage}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Detalles adicionales */}
          {log.details && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Detalles Adicionales</h3>
              <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
                <pre className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap break-words overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
