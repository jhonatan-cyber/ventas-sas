"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { User, CreditCard, Mail, Edit, Trash2, Power, PowerOff, MoreVertical, Eye, MapPin, Phone, Building } from "lucide-react"
import { Customer } from "@/lib/types"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface CustomersCardsProps {
  customers: Customer[]
  onEdit?: (customer: Customer) => void
  onViewDetails?: (customer: Customer) => void
  onToggleStatus?: (customer: Customer) => void
  onDelete?: (customer: Customer) => void
}

export function CustomersCards({ customers, onEdit, onViewDetails, onToggleStatus, onDelete }: CustomersCardsProps) {
  const canViewDetails = useHasPermission("clientes_ver_detalles")
  const canEdit = useHasPermission("clientes_editar")
  const canDelete = useHasPermission("clientes_eliminar")
  const canActivate = useHasPermission("clientes_activar")
  const canDeactivate = useHasPermission("clientes_desactivar")
  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
          <Building className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">No hay clientes registrados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {customers.map((customer) => {
        // Mostrar solo nombre + apellido
        const hasNombreApellido = customer.nombre?.trim() && customer.apellido?.trim()
        const displayName = hasNombreApellido
          ? `${customer.nombre} ${customer.apellido}`
          : customer.nombre || customer.apellido || "Cliente"
        
        const initials = customer.nombre?.[0]?.toUpperCase() || 
                       customer.apellido?.[0]?.toUpperCase() || 
                       "C"

        return (
          <Card key={customer.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Header con avatar, nombre, badge y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <User className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                          {displayName}
                        </span>
                        <Badge
                          className={
                            customer.isActive
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0.5 shrink-0'
                              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0.5 shrink-0'
                          }
                        >
                          {customer.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{customer.email}</span>
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
                      <DropdownMenuItem 
                        onClick={() => onViewDetails?.(customer)} 
                        className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canViewDetails}
                      >
                        <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onEdit?.(customer)} 
                        className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canEdit}
                      >
                        <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus?.(customer)} 
                        className={`cursor-pointer ${
                          customer.isActive 
                            ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                            : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={
                          (customer.isActive && !canDeactivate) || 
                          (!customer.isActive && !canActivate)
                        }
                      >
                        {customer.isActive 
                          ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                          : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                        }
                        <span className={customer.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                          {customer.isActive ? 'Desactivar' : 'Activar'}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(customer)} 
                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                        <span className="text-red-600 dark:text-red-400">Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Información detallada - CI, Dirección y Teléfono */}
                {(customer.ci || customer.direccion || customer.telefono) && (
                  <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a] space-y-1.5">
                    {customer.ci && (
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 font-mono truncate">CI: {customer.ci}</span>
                      </div>
                    )}
                    {customer.telefono && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">{customer.telefono}</span>
                      </div>
                    )}
                    {customer.direccion && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2">{customer.direccion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

