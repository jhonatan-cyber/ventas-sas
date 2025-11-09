"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Shield,
  FileText,
  Lock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RoleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleWithStats | null
}

export function RoleDetailDialog({
  open,
  onOpenChange,
  role,
}: RoleDetailDialogProps) {
  if (!role) return null

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const permissions = Array.isArray(role.permissions) ? role.permissions : []
  const userCount = role._count.adminUsers || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold">
                  {role.name}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    role.isActive !== false
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                  }
                >
                  {role.isActive !== false ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {role.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {role.description}
                </p>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Información detallada del rol del sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información General */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Nombre del Rol</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {role.name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                <Badge
                  variant="secondary"
                  className={
                    role.isActive !== false
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                  }
                >
                  {role.isActive !== false ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </>
                  )}
                </Badge>
              </div>
              {role.description && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {role.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Permisos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Permisos ({permissions.length})
            </h3>
            {permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-gray-300 dark:border-gray-600"
                  >
                    {String(permission)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Este rol no tiene permisos asignados
              </p>
            )}
          </div>

          <Separator />

          {/* Usuarios Asociados */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios Asociados
            </h3>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Usuarios</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {userCount} {userCount === 1 ? "usuario" : "usuarios"}
                </Badge>
              </div>
              {userCount === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                  No hay usuarios asociados a este rol
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del Sistema */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Información del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Creación</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(role.createdAt)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">ID del Rol</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400 text-xs break-all">
                  {role.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

