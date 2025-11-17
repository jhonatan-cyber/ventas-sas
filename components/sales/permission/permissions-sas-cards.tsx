"use client"

import { Shield, Tag, Users, Trash2, Power, PowerOff, MoreVertical, FolderOpen, FolderClosed } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PermissionSasInfo } from "@/lib/services/sales/permission-sas-service"

interface PermissionsSasCardsProps {
  permissions: PermissionSasInfo[]
  onDelete?: (permission: PermissionSasInfo) => void
  onToggleStatus?: (permission: PermissionSasInfo) => void
}

export function PermissionsSasCards({ permissions, onDelete, onToggleStatus }: PermissionsSasCardsProps) {
  // Estado para controlar qué módulos están expandidos (por defecto todos expandidos)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const categories = new Set(permissions.map(p => p.category || 'Otros'))
    const initial: Record<string, boolean> = {}
    categories.forEach(cat => {
      initial[cat] = true // Por defecto todos expandidos
    })
    return initial
  })

  // Agrupar permisos por categoría (módulo)
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, PermissionSasInfo[]> = {}
    
    permissions.forEach((permission) => {
      const category = permission.category || 'Otros'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(permission)
    })
    
    // Ordenar categorías alfabéticamente
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key]
        return acc
      }, {} as Record<string, PermissionSasInfo[]>)
  }, [permissions])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  if (permissions.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 md:hidden overflow-x-hidden max-w-full">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
        const isExpanded = expandedCategories[category] !== false // Por defecto true
        
        return (
          <div key={category} className="space-y-3">
            {/* Encabezado del módulo */}
            <div className="flex items-center gap-2 px-2">
              <Button
                variant="ghost"
                className="flex items-center gap-2 flex-1 justify-start h-auto p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg"
                onClick={() => toggleCategory(category)}
              >
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                ) : (
                  <FolderClosed className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                )}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {category}
                </h3>
              </Button>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {categoryPermissions.length}
              </Badge>
            </div>
            
            {/* Cards de permisos del módulo - solo mostrar si está expandido */}
            {isExpanded && (
              <div className="grid grid-cols-1 gap-3 overflow-x-hidden max-w-full">
                {categoryPermissions.map((permission) => (
                  <Card key={permission.name} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow overflow-x-hidden max-w-full">
          <CardContent className="p-3 overflow-x-hidden max-w-full">
            <div className="space-y-3">
              {/* Header con nombre, badge y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {permission.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          (permission.isActive ?? true)
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0.5 shrink-0'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0.5 shrink-0'
                        }
                      >
                        {(permission.isActive ?? true) ? 'Activo' : 'Inactivo'}
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
                    {onToggleStatus && (
                      <DropdownMenuItem
                        onClick={() => onToggleStatus(permission)}
                        className={`cursor-pointer ${
                          (permission.isActive ?? true)
                            ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                            : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                        }`}
                      >
                        {(permission.isActive ?? true)
                          ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                          : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        }
                        <span className={(permission.isActive ?? true) ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                          {(permission.isActive ?? true) ? 'Desactivar' : 'Activar'}
                        </span>
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(permission)}
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
                {/* Descripción */}
                {permission.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2">{permission.description}</span>
                  </div>
                )}

                {/* Categoría y Roles */}
                <div className="grid grid-cols-2 gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="h-3 w-3 text-gray-400 shrink-0" />
                    <Badge variant="outline" className="text-[10px] px-1 py-0 truncate">
                      {permission.category}
                    </Badge>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Users className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium truncate">{permission.roleCount} roles</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          {permission.roles.length > 0 ? (
                            <div>
                              <p className="font-semibold mb-1 text-xs">Roles:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {permission.roles.map((role) => (
                                  <li key={role} className="text-xs">
                                    {role}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-xs">No asignado a ningún rol</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

