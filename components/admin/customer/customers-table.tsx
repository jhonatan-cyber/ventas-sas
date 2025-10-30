"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Edit, Trash2, Power, PowerOff } from "lucide-react"
import { Customer } from "@/lib/types"

interface CustomersTableProps {
  customers: Customer[]
  isLoading?: boolean
  onEditClick?: (customer: Customer) => void
  onDeleteClick?: (customer: Customer) => void
  onToggleStatus?: (customer: Customer) => void
}

export function CustomersTable({ customers, isLoading, onEditClick, onDeleteClick, onToggleStatus }: CustomersTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando clientes...
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Cliente</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">NIT/CI</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Contacto</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Dirección</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Edit className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay clientes registrados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                // Priorizar razón social si existe, sino nombre + apellido
                const hasNombreApellido = customer.nombre?.trim() && customer.apellido?.trim()
                const hasRazonSocial = customer.razonSocial?.trim()
                
                const displayName = hasRazonSocial 
                  ? customer.razonSocial
                  : hasNombreApellido
                    ? `${customer.nombre} ${customer.apellido}`
                    : "Cliente"
                
                const secondaryName = hasRazonSocial && hasNombreApellido
                  ? `${customer.nombre} ${customer.apellido}`
                  : null
                
                const initials = customer.razonSocial?.[0]?.toUpperCase() || 
                               customer.nombre?.[0]?.toUpperCase() || 
                               "C"
                
                return (
                  <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                    <TableCell>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {displayName}
                          </span>
                          {secondaryName && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{secondaryName}</span>
                          )}
                          {!secondaryName && customer.email && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {customer.nit && (
                          <span className="text-sm text-gray-900 dark:text-white">NIT: {customer.nit}</span>
                        )}
                        {customer.ci && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">CI: {customer.ci}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.telefono ? (
                        <span className="text-sm text-gray-900 dark:text-white">{customer.telefono}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.direccion ? (
                        <span className="text-sm text-gray-900 dark:text-white">{customer.direccion}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={customer.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"}>
                        {customer.isActive ? "Activo" : "Inactivo"}
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
                                onClick={() => onEditClick(customer)}
                                className="hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar cliente</TooltipContent>
                          </Tooltip>
                        )}
                        {onToggleStatus && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleStatus(customer)}
                                className={customer.isActive 
                                  ? "hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                  : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                }
                              >
                                {customer.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {customer.isActive ? "Desactivar cliente" : "Activar cliente"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(customer)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar cliente</TooltipContent>
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
