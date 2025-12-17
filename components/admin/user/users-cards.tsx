"use client"

import { User, CreditCard, Shield, Phone, MapPin, Edit, Trash2, Power, PowerOff, Mail, MoreVertical, Eye } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"

interface UsersCardsProps {
  users: UserWithDetails[]
  onEdit?: (user: UserWithDetails) => void
  onView?: (user: UserWithDetails) => void
  onToggleStatus?: (userId: string, currentStatus: boolean) => void
  onDelete?: (userId: string, userName: string) => void
}

export function UsersCards({ users, onEdit, onView, onToggleStatus, onDelete }: UsersCardsProps) {
  // Función para dividir el nombre completo en nombre y apellido
  const getFullNameParts = (fullName: string | null) => {
    if (!fullName) return { firstName: '', lastName: '' }
    const parts = fullName.split(" ")
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {users.map((user) => {
        const { firstName, lastName } = getFullNameParts(user.fullName)
        return (
          <Card key={user.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Header con avatar, nombre, badges y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={(user as any).photo || undefined} alt={user.fullName || user.email || 'Usuario'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                        {firstName[0]?.toUpperCase() || lastName[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <User className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                          {firstName || '-'} {lastName || ''}
                        </span>
                        <Badge 
                          className={
                            user.isActive 
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0.5 shrink-0' 
                              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0.5 shrink-0'
                          }
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                        </div>
                      )}
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
                      <DropdownMenuItem onClick={() => onView?.(user)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                        <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit?.(user)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                        <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus?.(user.id, user.isActive ?? false)} 
                        className={`cursor-pointer ${
                          user.isActive 
                            ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                            : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                        }`}
                      >
                        {user.isActive 
                          ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                          : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        }
                        <span className={user.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(user.id, user.fullName || user.email)} 
                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
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
                    {/* CI */}
                    {(user as any).ci && (
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 font-mono truncate">{(user as any).ci}</span>
                      </div>
                    )}

                    {/* Rol */}
                    {(user.role || user.isSuperAdmin) && (
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-gray-400 shrink-0" />
                        <Badge 
                          variant="secondary" 
                          className={
                            user.isSuperAdmin
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[10px] px-1 py-0"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1 py-0"
                          }
                        >
                          {user.isSuperAdmin ? "Super Administrador" : (user.role || "-")}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-1.5">
                    {/* Teléfono */}
                    {user.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">{user.phone}</span>
                      </div>
                    )}

                    {/* Dirección debajo del teléfono */}
                    {user.phone && user.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2">{user.address}</span>
                      </div>
                    )}

                    {/* Dirección (si no hay teléfono, muestra dirección aquí) */}
                    {!user.phone && user.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2">{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

