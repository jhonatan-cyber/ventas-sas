"use client"

import {
  FileText,
  Lock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PermissionSasService } from "@/lib/services/sales/permission-sas-service"

type RoleSasWithRelations = {
  id: string
  nombre: string
  descripcion?: string | null
  isActive: boolean
  permissions?: any
  createdAt: Date
  organization?: { razonSocial: string | null; name: string | null; slug: string | null } | null
  sucursal?: { name: string } | null
  _count?: { usuariosSas: number }
}

interface RoleSasDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleSasWithRelations | null
}

export function RoleSasDetailDialog({
  open,
  onOpenChange,
  role,
}: RoleSasDetailDialogProps) {
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

  const permissions = Array.isArray(role?.permissions) ? role.permissions : []
  const userCount = role?._count?.usuariosSas || 0

  // Función para extraer el módulo del nombre del permiso (formato: modulo_accion)
  const getModuleFromPermission = (permissionName: string): string => {
    const parts = String(permissionName).split('_')
    return parts[0] || 'unknown'
  }

  // Agrupar permisos por módulo
  const permissionsByModule = useMemo(() => {
    if (!role) return {}
    const grouped: Record<string, string[]> = {}
    permissions.forEach((perm) => {
      const module = getModuleFromPermission(perm)
      if (!grouped[module]) {
        grouped[module] = []
      }
      grouped[module].push(String(perm))
    })
    return grouped
  }, [permissions, role])

  if (!role) return null

  // Obtener módulos disponibles
  const availableModules = PermissionSasService.getAvailableModules()

  // Ordenar módulos según el orden de availableModules y filtrar solo los que tienen permisos
  const modulesWithPermissions = availableModules
    .filter(m => permissionsByModule[m.id] && permissionsByModule[m.id].length > 0)
    .map(m => ({
      id: m.id,
      label: m.label,
      permissions: permissionsByModule[m.id],
    }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {role.nombre}
            </DialogTitle>
            <DialogDescription>
              Información detallada del rol del sistema
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
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
                    {role.nombre}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                  <Badge
                    variant="secondary"
                    className={
                      role.isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                        : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                    }
                  >
                    {role.isActive ? (
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
                {role.descripcion && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {role.descripcion}
                    </p>
                  </div>
                )}
                {role.sucursal && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {role.sucursal.name}
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
                <Accordion type="multiple" className="w-full space-y-2">
                  {modulesWithPermissions.map((module) => (
                    <AccordionItem
                      key={module.id}
                      value={module.id}
                      className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-4 bg-white dark:bg-[#1a1a1a]"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {module.label}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs"
                            >
                              {module.permissions.length}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {module.permissions.map((permission, index) => {
                            // Extraer la acción del permiso (formato: modulo_accion)
                            const action = permission.split('_').slice(1).join('_')
                            return (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs border-gray-300 dark:border-gray-600"
                              >
                                {action.replace(/_/g, ' ')}
                              </Badge>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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

          {/* Footer estático */}
          <div className="flex justify-center border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              variant="new"
              rounded="full"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

