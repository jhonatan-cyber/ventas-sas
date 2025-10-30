"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, Power, PowerOff, Calendar, Building2 } from "lucide-react"

interface SubscriptionWithDetails {
  id: string
  customerId: string
  planId: string
  status: string
  billingPeriod: string
  startDate: Date
  endDate: Date | null
  autoRenew: boolean
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string
    razonSocial: string | null
    nit: string | null
    nombre: string | null
    apellido: string | null
    email: string | null
  }
  plan: {
    id: string
    name: string
    priceMonthly: number | null
    priceYearly: number | null
  }
}

interface SubscriptionsTableProps {
  subscriptions: SubscriptionWithDetails[]
  onEdit?: (subscription: SubscriptionWithDetails) => void
  onToggleStatus?: (subscriptionId: string, currentStatus: string) => void
  onDelete?: (subscriptionId: string, customerName: string) => void
}

export function SubscriptionsTable({ subscriptions, onEdit, onToggleStatus, onDelete }: SubscriptionsTableProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
      case 'trial':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'cancelled':
        return 'Cancelada'
      case 'expired':
        return 'Expirada'
      case 'trial':
        return 'Prueba'
      default:
        return status
    }
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
                  <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Cliente</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Plan</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Período</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Vigencia</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No hay suscripciones registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]">
                  <TableCell>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {subscription.customer.razonSocial || `${subscription.customer.nombre || ''} ${subscription.customer.apellido || ''}`.trim() || subscription.customer.email || 'Cliente sin nombre'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {subscription.customer.nit || subscription.customer.email || 'Sin identificador'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {subscription.plan.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(subscription.status)}>
                      {getStatusLabel(subscription.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {subscription.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 py-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(subscription.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(subscription.endDate)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            onClick={() => onEdit?.(subscription)}
                          >
                            <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar suscripción</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              subscription.status === 'active'
                                ? "hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                : "hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}
                            onClick={() => onToggleStatus?.(subscription.id, subscription.status)}
                          >
                            {subscription.status === 'active'
                              ? <PowerOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              : <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                            }
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {subscription.status === 'active' ? 'Cancelar suscripción' : 'Activar suscripción'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => onDelete?.(subscription.id, subscription.customer.razonSocial || `${subscription.customer.nombre || ''} ${subscription.customer.apellido || ''}`.trim() || subscription.customer.email || 'Cliente sin nombre')}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar suscripción</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
