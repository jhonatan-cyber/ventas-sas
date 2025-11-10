"use client"

import { Shield, FileText, Lock, Users, Settings, Edit, Trash2, Power, PowerOff, MoreVertical, Eye, Key } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RolesCardsProps {
  roles: RoleWithStats[]
  onEdit?: (role: RoleWithStats) => void
  onView?: (role: RoleWithStats) => void
  onToggleStatus?: (roleId: string, roleName: string, currentStatus: boolean, userCount: number) => void
  onDelete?: (roleId: string, roleName: string) => void
  onManagePermissions?: (role: RoleWithStats) => void
}

export function RolesCards({ roles, onEdit, onView, onToggleStatus, onDelete, onManagePermissions }: RolesCardsProps) {
  // Si no hay roles, no renderizar nada (el contenedor padre maneja el estado vacío)
  if (roles.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {roles.map((role) => (
        <Card key={role.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Header con nombre, badge y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Shield className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {role.name}
                      </span>
                      <Badge
                        className={
                          role.isActive ?? true
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0.5 shrink-0'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0.5 shrink-0'
                        }
                      >
                        {role.isActive ?? true ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Menú de acciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onView?.(role)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                      <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit?.(role)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                      <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onManagePermissions?.(role)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                      <Key className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">Gestionar permisos</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onToggleStatus?.(role.id, role.name, role.isActive ?? false, role._count.adminUsers || 0)}
                      className={`cursor-pointer ${
                        role.isActive ?? false
                          ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                          : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                      }`}
                    >
                      {role.isActive ?? false
                        ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                        : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      }
                      <span className={role.isActive ?? false ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                        {role.isActive ?? false ? 'Desactivar' : 'Activar'}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(role.id, role.name)}
                      className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                      disabled={(role._count.adminUsers || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400">Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Información detallada en dos columnas */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                {/* Columna izquierda */}
                <div className="space-y-1.5">
                  {/* Descripción si existe */}
                  {role.description && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2">{role.description}</span>
                    </div>
                  )}

                  {/* Usuarios */}
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-gray-400 shrink-0" />
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1 py-0"
                    >
                      {role._count.adminUsers || 0} usuarios
                    </Badge>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-1.5">
                  {/* Permisos */}
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                      {(Array.isArray(role.permissions) ? role.permissions.length : 0)} permisos
                    </span>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-1.5">
                    <Settings className="h-3 w-3 text-gray-400 shrink-0" />
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1 py-0 ${
                        role.isActive ?? true
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                          : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      {role.isActive ?? true ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

