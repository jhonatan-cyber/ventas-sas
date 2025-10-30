"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, Edit, Trash2, Power, PowerOff, MapPin, Phone } from "lucide-react"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"

interface UsersTableProps {
  users: UserWithDetails[]
  onEdit?: (user: UserWithDetails) => void
  onToggleStatus?: (userId: string, currentStatus: boolean) => void
  onDelete?: (userId: string, userName: string) => void
}

export function UsersTable({ users, onEdit, onToggleStatus, onDelete }: UsersTableProps) {
  // Función para dividir el nombre completo en nombre y apellido
  const getFullNameParts = (fullName: string | null) => {
    if (!fullName) return { firstName: '', lastName: '' }
    const parts = fullName.split(' ')
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    }
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Usuario</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">CI</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Rol</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Contacto</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Eye className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const { firstName, lastName } = getFullNameParts(user.fullName)
                return (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                            {firstName[0]?.toUpperCase() || lastName[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {firstName || '-'} {lastName || ''}
                          </span>
                          {user.email && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                          )}
                        </div>
                        {user.isSuperAdmin && (
                          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs px-2 py-0.5">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="py-2">
                        <span className="text-gray-900 dark:text-white font-mono text-sm">
                          {(user as any).ci || '-'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-1.5 py-2">
                        {user.address && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm truncate max-w-[200px]">{user.address}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm">{user.phone}</span>
                          </div>
                        )}
                        {!user.address && !user.phone && (
                          <span className="text-sm text-gray-400 italic">Sin contacto</span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        className={
                          user.isActive 
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                        }
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalles</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              onClick={() => onEdit?.(user)}
                            >
                              <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar usuario</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ${
                                user.isActive 
                                  ? "hover:bg-orange-50 dark:hover:bg-orange-900/20" 
                                  : "hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                              onClick={() => onToggleStatus?.(user.id, user.isActive ?? false)}
                            >
                              {user.isActive 
                                ? <PowerOff className="h-4 w-4 text-orange-600 dark:text-orange-400" /> 
                                : <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                              }
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {user.isActive ? "Desactivar usuario" : "Activar usuario"}
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => onDelete?.(user.id, user.fullName || user.email)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar usuario</TooltipContent>
                        </Tooltip>
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

