"use client"

import { SalesCustomer } from "@prisma/client"
import { Mail, Phone, MapPin, CreditCard, Edit, Trash2, Power, PowerOff, MoreVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface SalesCustomersCardsProps {
  customers: SalesCustomer[]
  onEdit?: (customer: SalesCustomer) => void
  onToggleStatus?: (customer: SalesCustomer) => void
  onDelete?: (customer: SalesCustomer) => void
}

export function SalesCustomersCards({ customers, onEdit, onToggleStatus, onDelete }: SalesCustomersCardsProps) {
  if (customers.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {customers.map((customer) => {
        const firstName = customer.name?.trim() || ""
        const lastName = customer.lastName?.trim() || ""
        const fullName = `${firstName} ${lastName}`.trim() || customer.name

        return (
          <Card key={customer.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Header con nombre, badge y menú de acciones */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                          {fullName}
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
                        <DropdownMenuItem onClick={() => onEdit(customer)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                          <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                        </DropdownMenuItem>
                      )}
                      {onToggleStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(customer)}
                            className={`cursor-pointer ${
                              customer.isActive
                                ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                                : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                            }`}
                          >
                            {customer.isActive
                              ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                              : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                            }
                            <span className={customer.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                              {customer.isActive ? 'Desactivar' : 'Activar'}
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(customer)}
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
                <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <div className="space-y-2">
                    {/* Primera fila: CI/RUC y Teléfono */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* CI/RUC */}
                      {customer.ruc && (
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{customer.ruc}</span>
                        </div>
                      )}

                      {/* Teléfono */}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Segunda fila: Correo y Dirección */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Email */}
                      {customer.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{customer.email}</span>
                        </div>
                      )}

                      {/* Dirección */}
                      {customer.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
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

