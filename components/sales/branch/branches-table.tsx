"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Edit, Trash2, Power, PowerOff, Building2, Mail, Phone, MapPin } from "lucide-react"
import { Branch } from "@prisma/client"

interface BranchesTableProps {
  branches: Branch[]
  isLoading?: boolean
  onEditClick?: (branch: Branch) => void
  onDeleteClick?: (branch: Branch) => void
  onToggleStatus?: (branch: Branch) => void
}

export function BranchesTable({ branches, isLoading, onEditClick, onDeleteClick, onToggleStatus }: BranchesTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando sucursales...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Sucursal</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Contacto</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Dirección</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay sucursales registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => {
                const initials = branch.name.substring(0, 2).toUpperCase()
                
                return (
                  <TableRow key={branch.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {branch.name}
                          </span>
                          {branch.email && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{branch.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {branch.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {branch.phone}
                          </div>
                        )}
                        {branch.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Mail className="h-3 w-3" />
                            {branch.email}
                          </div>
                        )}
                        {!branch.phone && !branch.email && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {branch.address ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{branch.address}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={branch.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"}>
                        {branch.isActive ? "Activa" : "Inactiva"}
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
                                onClick={() => onEditClick(branch)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar sucursal</TooltipContent>
                          </Tooltip>
                        )}
                        {onToggleStatus && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleStatus(branch)}
                                className={branch.isActive 
                                  ? "hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                  : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                }
                              >
                                {branch.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {branch.isActive ? "Desactivar sucursal" : "Activar sucursal"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(branch)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar sucursal</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

