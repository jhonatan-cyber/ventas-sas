"use client"

import { UsuarioSas } from "@prisma/client"
import { Edit, Trash2, Power, PowerOff, User, Mail, Phone, MapPin, CreditCard, Shield, Building2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


interface UsuariosSasTableProps {
  usuarios: (UsuarioSas & {
    rol: { id: string; nombre: string } | null
    sucursal: { id: string; name: string } | null
    customer?: any
  })[]
  sucursalesCount?: number
  isLoading?: boolean
  onEditClick?: (usuario: UsuarioSas & { rol: any; sucursal: any }) => void
  onDeleteClick?: (usuario: UsuarioSas & { rol: any; sucursal: any }) => void
  onToggleStatus?: (usuario: UsuarioSas & { rol: any; sucursal: any }) => void
}

export function UsuariosSasTable({ usuarios, sucursalesCount, isLoading, onEditClick, onDeleteClick, onToggleStatus }: UsuariosSasTableProps) {
  const showSucursalColumn = (sucursalesCount || 0) > 1
  if (isLoading) {
    return <TableSkeleton columns={showSucursalColumn ? 6 : 5} rows={5} showActions={true} />
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Usuario</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">CI</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Contacto</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Rol</TableHead>
              {showSucursalColumn && <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Sucursal</TableHead>}
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSucursalColumn ? 7 : 6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => {
                const initials = `${usuario.nombre?.[0]?.toUpperCase() || ''}${usuario.apellido?.[0]?.toUpperCase() || ''}`
                const fullName = `${usuario.nombre} ${usuario.apellido}`
                
                return (
                  <TableRow key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="w-10 h-10">
                          {usuario.foto ? (
                            <AvatarImage 
                              src={usuario.foto} 
                              alt={fullName}
                              key={usuario.foto} // Forzar actualización cuando cambia la foto
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                            {initials || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {fullName}
                          </span>
                          {usuario.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Mail className="h-3 w-3" />
                              <span>{usuario.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {usuario.ci ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <CreditCard className="h-3 w-3 text-gray-400" />
                          <span>{usuario.ci}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {usuario.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{usuario.phone}</span>
                          </div>
                        )}
                        {usuario.address && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>{usuario.address}</span>
                          </div>
                        )}
                        {!usuario.phone && !usuario.address && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {usuario.rol ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            {usuario.rol.nombre}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin rol</span>
                      )}
                    </TableCell>
                    {showSucursalColumn && (
                      <TableCell>
                        {usuario.sucursal ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
                              {usuario.sucursal.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Todas</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={usuario.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"}>
                        {usuario.isActive ? "Activo" : "Inactivo"}
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
                                onClick={() => onEditClick(usuario)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar usuario</TooltipContent>
                          </Tooltip>
                        )}
                        {onToggleStatus && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleStatus(usuario)}
                                className={usuario.isActive 
                                  ? "hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                  : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                }
                              >
                                {usuario.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {usuario.isActive ? "Desactivar usuario" : "Activar usuario"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(usuario)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar usuario</TooltipContent>
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

