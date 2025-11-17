"use client"

import { Branch } from "@prisma/client"
import { Building2, Mail, Phone, MapPin, Users, Edit, Trash2, Power, PowerOff, MoreVertical, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface BranchesCardsProps {
  branches: (Branch & {
    organization?: { id: string; razonSocial: string | null; name: string | null; slug: string | null } | null
    _count?: { usuariosSas: number }
  })[]
  onEdit?: (branch: Branch & { organization?: any; _count?: any }) => void
  onViewDetails?: (branch: Branch & { organization?: any; _count?: any }) => void
  onToggleStatus?: (branch: Branch & { organization?: any; _count?: any }) => void
  onDelete?: (branch: Branch & { organization?: any; _count?: any }) => void
}

export function BranchesCards({ branches, onEdit, onViewDetails, onToggleStatus, onDelete }: BranchesCardsProps) {
  if (branches.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {branches.map((branch) => (
        <Card key={branch.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header con nombre, badge y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {branch.name}
                      </span>
                      <Badge
                        className={
                          branch.isActive
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-xs px-2 py-0.5 shrink-0'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-xs px-2 py-0.5 shrink-0'
                        }
                      >
                        {branch.isActive ? 'Activa' : 'Inactiva'}
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
                    {onViewDetails && (
                      <>
                        <DropdownMenuItem onClick={() => onViewDetails(branch)} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                          <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(branch)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                        <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                      </DropdownMenuItem>
                    )}
                    {onToggleStatus && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(branch)}
                          className={`cursor-pointer ${
                            branch.isActive
                              ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                              : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                          }`}
                        >
                          {branch.isActive
                            ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                            : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          }
                          <span className={branch.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                            {branch.isActive ? 'Desactivar' : 'Activar'}
                          </span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(branch)}
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
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                {/* Email */}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{branch.email}</span>
                  </div>
                )}

                {/* Teléfono */}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{branch.phone}</span>
                  </div>
                )}

                {/* Dirección */}
                {branch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{branch.address}</span>
                  </div>
                )}

                {/* Usuarios */}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs px-2 py-0"
                  >
                    {branch._count?.usuariosSas || 0} usuarios
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

