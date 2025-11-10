"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Edit, Trash2, Power, PowerOff, User, CreditCard, MapPin, Phone, Eye } from "lucide-react"
import { Customer } from "@/lib/types"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface CustomersTableProps {
  customers: Customer[]
  isLoading?: boolean
  onViewDetails?: (customer: Customer) => void
  onEditClick?: (customer: Customer) => void
  onDeleteClick?: (customer: Customer) => void
  onToggleStatus?: (customer: Customer) => void
}

export function CustomersTable({ customers, isLoading, onViewDetails, onEditClick, onDeleteClick, onToggleStatus }: CustomersTableProps) {
  const canViewDetails = useHasPermission("clientes_ver_detalles")
  const canEdit = useHasPermission("clientes_editar")
  const canDelete = useHasPermission("clientes_eliminar")
  const canActivate = useHasPermission("clientes_activar")
  const canDeactivate = useHasPermission("clientes_desactivar")

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
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">

                  Cliente
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">

                  CI
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">
 
                  Dirección
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">
 
                  Teléfono
                </div>
              </TableHead>
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
                // Mostrar solo nombre + apellido
                const hasNombreApellido = customer.nombre?.trim() && customer.apellido?.trim()
                const displayName = hasNombreApellido
                  ? `${customer.nombre} ${customer.apellido}`
                  : customer.nombre || customer.apellido || "Cliente"

                const initials = customer.nombre?.[0]?.toUpperCase() ||
                  customer.apellido?.[0]?.toUpperCase() ||
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
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {displayName}
                            </span>
                          </div>
                          {customer.email && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-5">{customer.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.ci ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white font-mono">{customer.ci}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.address ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{customer.phone}</span>
                        </div>
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
                        {onViewDetails && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewDetails(customer)}
                                  disabled={!canViewDetails}
                                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canViewDetails ? "Ver detalles" : "No tiene permiso para ver detalles"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onEditClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditClick(customer)}
                                  disabled={!canEdit}
                                  className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canEdit ? "Editar cliente" : "No tiene permiso para editar clientes"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onToggleStatus && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onToggleStatus(customer)}
                                  disabled={
                                    (customer.isActive && !canDeactivate) || 
                                    (!customer.isActive && !canActivate)
                                  }
                                  className={`${
                                    customer.isActive
                                      ? "hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                      : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {customer.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {customer.isActive 
                                ? (canDeactivate ? "Desactivar cliente" : "No tiene permiso para desactivar clientes")
                                : (canActivate ? "Activar cliente" : "No tiene permiso para activar clientes")
                              }
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteClick(customer)}
                                  disabled={!canDelete}
                                  className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canDelete ? "Eliminar cliente" : "No tiene permiso para eliminar clientes"}
                            </TooltipContent>
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
