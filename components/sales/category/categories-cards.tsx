"use client"

import { Category } from "@prisma/client"
import { Folder, FileText, Package, Edit, Trash2, Power, PowerOff, MoreVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface CategoriesCardsProps {
  categories: (Category & {
    _count?: { products: number }
  })[]
  onEdit?: (category: Category) => void
  onToggleStatus?: (category: Category) => void
  onDelete?: (category: Category) => void
}

export function CategoriesCards({ categories, onEdit, onToggleStatus, onDelete }: CategoriesCardsProps) {
  if (categories.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:hidden">
      {categories.map((category) => (
        <Card key={category.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header con nombre, badge y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {category.name}
                      </span>
                      <Badge
                        className={
                          category.isActive
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-xs px-2 py-0.5 shrink-0'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-xs px-2 py-0.5 shrink-0'
                        }
                      >
                        {category.isActive ? 'Activa' : 'Inactiva'}
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
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                        <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                      </DropdownMenuItem>
                    )}
                    {onToggleStatus && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(category)}
                          className={`cursor-pointer ${
                            category.isActive
                              ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                              : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                          }`}
                        >
                          {category.isActive
                            ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                            : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          }
                          <span className={category.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                            {category.isActive ? 'Desactivar' : 'Activar'}
                          </span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(category)}
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
                {category.description && (
                  <div className="flex items-start gap-2 col-span-2">
                    <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{category.description}</span>
                  </div>
                )}
                {category._count?.products !== undefined && (
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {category._count.products} {category._count.products === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

