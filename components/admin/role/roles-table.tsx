"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Edit, Trash2, Power, PowerOff } from "lucide-react"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RolesTableProps {
  roles: RoleWithStats[]
  onEdit?: (role: RoleWithStats) => void
  onToggleStatus?: (roleId: string, currentStatus: boolean) => void
  onDelete?: (roleId: string, roleName: string) => void
}

export function RolesTable({ roles, onEdit, onToggleStatus, onDelete }: RolesTableProps) {
  return (
    <TooltipProvider>
      <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 dark:bg-[#2a2a2a]">
          <TableHead className="text-gray-700 dark:text-gray-300">Rol</TableHead>
          <TableHead className="text-gray-700 dark:text-gray-300">Descripción</TableHead>
          <TableHead className="text-gray-700 dark:text-gray-300">Permisos</TableHead>
          <TableHead className="text-gray-700 dark:text-gray-300">Usuarios</TableHead>
          <TableHead className="text-gray-700 dark:text-gray-300">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No hay roles registrados
            </TableCell>
          </TableRow>
        ) : (
          roles.map((role) => (
            <TableRow key={role.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
              <TableCell className="font-medium text-gray-900 dark:text-white">{role.name}</TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400">{role.description || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(role.permissions) ? role.permissions : []).slice(0, 2).map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
                      {String(permission)}
                    </Badge>
                  ))}
                  {Array.isArray(role.permissions) && role.permissions.length > 2 && (
                    <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
                      +{role.permissions.length - 2} más
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {role._count.organizationMembers} usuarios
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalles</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 dark:text-gray-400"
                        onClick={() => onEdit?.(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar rol</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          role.isActive ?? false 
                            ? "text-orange-600 hover:text-orange-700" 
                            : "text-green-600 hover:text-green-700"
                        }`}
                        onClick={() => {
                          console.log('Toggle status clicked:', { id: role.id, currentStatus: role.isActive })
                          onToggleStatus?.(role.id, role.isActive ?? false)
                        }}
                      >
                        {role.isActive ?? false ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {role.isActive ?? false ? "Desactivar rol" : "Activar rol"}
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={role._count.organizationMembers > 0}
                        onClick={() => onDelete?.(role.id, role.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {role._count.organizationMembers > 0 
                        ? "No se puede eliminar: tiene usuarios asignados" 
                        : "Eliminar rol"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    </TooltipProvider>
  )
}