"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, Power, PowerOff, Shield } from "lucide-react"
import { RoleSas } from "@prisma/client"

interface RolesSasTableProps {
  roles: (RoleSas & {
    customer: { razonSocial: string | null; nombre: string | null; apellido: string | null } | null
    sucursal: { name: string } | null
  })[]
  isLoading?: boolean
  onEditClick?: (role: RoleSas & { customer: any; sucursal: any }) => void
  onDeleteClick?: (role: RoleSas & { customer: any; sucursal: any }) => void
  onToggleStatus?: (role: RoleSas & { customer: any; sucursal: any }) => void
}

export function RolesSasTable({ roles, isLoading, onEditClick, onDeleteClick, onToggleStatus }: RolesSasTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando roles...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Rol</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Descripción</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Sucursal</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Shield className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay roles registrados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                  <TableCell>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {role.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.descripcion ? (
                      <span className="text-sm text-gray-900 dark:text-white">{role.descripcion}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {role.sucursal ? (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
                        {role.sucursal.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">Todas las sucursales</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={role.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"}>
                      {role.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEditClick && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditClick(role)}
                              className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar rol</TooltipContent>
                        </Tooltip>
                      )}
                      {onToggleStatus && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleStatus(role)}
                              className={role.isActive 
                                ? "hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              }
                            >
                              {role.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {role.isActive ? "Desactivar rol" : "Activar rol"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {onDeleteClick && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteClick(role)}
                              className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar rol</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

