"use client"

import { UsuarioSas } from "@prisma/client"
import { User, Mail, Phone, MapPin, CreditCard, Shield, Building2, Edit, Trash2, Power, PowerOff, MoreVertical, Eye } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface UsuariosSasCardsProps {
  usuarios: (UsuarioSas & {
    rol?: { id: string; nombre: string } | null
    sucursal?: { id: string; name: string } | null
    customer?: any
  })[]
  sucursalesCount?: number
  onEdit?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
  onToggleStatus?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
  onDelete?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
  onView?: (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => void
}

export function UsuariosSasCards({ usuarios, sucursalesCount, onEdit, onToggleStatus, onDelete, onView }: UsuariosSasCardsProps) {
  if (usuarios.length === 0) {
    return null
  }

  const showSucursalColumn = (sucursalesCount || 0) > 1

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {usuarios.map((usuario) => {
        const initials = `${usuario.nombre?.[0]?.toUpperCase() || ''}${usuario.apellido?.[0]?.toUpperCase() || ''}`
        const fullName = `${usuario.nombre} ${usuario.apellido}`

        return (
          <Card key={usuario.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Header con avatar, nombre y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 shrink-0">
                      {usuario.foto ? (
                        <AvatarImage src={usuario.foto} alt={fullName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                        {initials || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                          {fullName}
                        </span>
                        <Badge
                          className={
                            usuario.isActive
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0.5 shrink-0'
                              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0.5 shrink-0'
                          }
                        >
                          {usuario.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {onView && (
                        <>
                          <DropdownMenuItem onClick={() => onView(usuario)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                            <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(usuario)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                          <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                        </DropdownMenuItem>
                      )}
                      {onToggleStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(usuario)}
                            className={`cursor-pointer ${
                              usuario.isActive
                                ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                                : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                            }`}
                          >
                            {usuario.isActive
                              ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                              : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                            }
                            <span className={usuario.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                              {usuario.isActive ? 'Desactivar' : 'Activar'}
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(usuario)}
                            className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                            <span className="text-red-600 dark:text-red-400">Eliminar</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Información detallada */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  {/* CI */}
                  {usuario.ci && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{usuario.ci}</span>
                    </div>
                  )}

                  {/* Email */}
                  {usuario.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{usuario.email}</span>
                    </div>
                  )}

                  {/* Teléfono */}
                  {usuario.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{usuario.phone}</span>
                    </div>
                  )}

                  {/* Rol */}
                  {usuario.rol ? (
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 truncate">{usuario.rol.nombre}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-400">Sin rol</span>
                    </div>
                  )}

                  {/* Sucursal (si hay más de una) */}
                  {showSucursalColumn && (
                    usuario.sucursal ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{usuario.sucursal.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-400">Todas</span>
                      </div>
                    )
                  )}

                  {/* Dirección */}
                  {usuario.address && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{usuario.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

