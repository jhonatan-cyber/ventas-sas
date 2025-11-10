"use client"

import { Shield, Users, Tag, Trash2, Power, PowerOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"
import { PermissionInfo } from "@/lib/services/admin/permission-admin-service"

interface PermissionsTableProps {
  permissions: PermissionInfo[]
  onDelete?: (permission: PermissionInfo) => void
  onToggleStatus?: (permission: PermissionInfo) => void
}

export function PermissionsTable({ permissions, onDelete, onToggleStatus }: PermissionsTableProps) {
  const canDelete = useHasPermission("permisos_eliminar")
  const canActivate = useHasPermission("permisos_activar")
  const canDeactivate = useHasPermission("permisos_desactivar")
  if (permissions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-8 text-center">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No se encontraron permisos con los filtros aplicados</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Permiso</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-[150px]">Categoría</TableHead>
            <TableHead className="w-[120px]">Roles</TableHead>
            <TableHead className="w-[100px]">Estado</TableHead>
            {(onDelete || onToggleStatus) && (
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission.name}>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-white">
                  {permission.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {permission.description}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <Tag className="h-3 w-3" />
                  {permission.category}
                </Badge>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{permission.roleCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        {permission.roles.length > 0 ? (
                          <div>
                            <p className="font-semibold mb-1">Roles:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {permission.roles.map((role) => (
                                <li key={role} className="text-sm">
                                  {role}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p>No asignado a ningún rol</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    (permission.isActive ?? true) === true
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                  }
                >
                  {(permission.isActive ?? true) === true ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              {(onDelete || onToggleStatus) && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onToggleStatus && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleStatus(permission)}
                                disabled={
                                  ((permission.isActive ?? true) === true && !canDeactivate) || 
                                  ((permission.isActive ?? true) !== true && !canActivate)
                                }
                                className={`h-8 w-8 ${
                                  (permission.isActive ?? true) === true
                                    ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {(permission.isActive ?? true) === true ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {(permission.isActive ?? true) === true 
                                ? (canDeactivate ? "Desactivar permiso" : "No tiene permiso para desactivar permisos")
                                : (canActivate ? "Activar permiso" : "No tiene permiso para activar permisos")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {onDelete && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(permission)}
                                disabled={!canDelete}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{canDelete ? "Eliminar permiso" : "No tiene permiso para eliminar permisos"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

