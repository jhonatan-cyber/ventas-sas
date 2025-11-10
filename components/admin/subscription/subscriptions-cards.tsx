"use client"

import { User, Package, CheckCircle, Calendar, DollarSign, Edit, Trash2, Power, PowerOff, MoreVertical, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"


import type { SubscriptionWithDetails } from "./types"

interface SubscriptionsCardsProps {
  subscriptions: SubscriptionWithDetails[]
  onEdit?: (subscription: SubscriptionWithDetails) => void
  onToggleStatus?: (subscriptionId: string, currentStatus: string) => void
  onDelete?: (subscriptionId: string, organizationName: string) => void
}

export function SubscriptionsCards({ subscriptions, onEdit, onToggleStatus, onDelete }: SubscriptionsCardsProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
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

  const getCustomerName = (customer: SubscriptionWithDetails['customer'], organization?: { name?: string | null; razonSocial?: string | null }) => {
    if (!customer) {
      return organization?.razonSocial || organization?.name || 'Sin cliente'
    }
    return `${customer.nombre || ''} ${customer.apellido || ''}`.trim() || customer.email || 'Sin nombre'
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">No hay suscripciones registradas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Header con cliente, plan, badge y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <User className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {getCustomerName(subscription.customer, subscription.organization || undefined)}
                      </span>
                      <Badge
                        className={`${getStatusColor(subscription.status)} text-[10px] px-1 py-0.5 shrink-0`}
                      >
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Package className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{subscription.plan.name}</span>
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
                    <DropdownMenuItem onClick={() => {}} className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400">
                      <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit?.(subscription)} className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400">
                      <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus?.(subscription.id, subscription.status)}
                      className={`cursor-pointer ${
                        subscription.status === 'active'
                          ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                          : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                      }`}
                    >
                      {subscription.status === 'active'
                        ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                        : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      }
                      <span className={subscription.status === 'active' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                        {subscription.status === 'active' ? 'Desactivar' : 'Activar'}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(subscription.id, subscription.organization?.razonSocial || subscription.organization?.name || getCustomerName(subscription.customer, subscription.organization || undefined) || 'Sin empresa')}
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
                  {/* Período de facturación */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                      {subscription.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}
                    </span>
                  </div>

                  {/* Fecha de inicio */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                      {formatDate(subscription.startDate)}
                    </span>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-1.5">
                  {/* Precio */}
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold truncate">
                      ${subscription.billingPeriod === 'monthly' && subscription.plan.priceMonthly
                        ? subscription.plan.priceMonthly.toLocaleString()
                        : subscription.billingPeriod === 'yearly' && subscription.plan.priceYearly
                        ? subscription.plan.priceYearly.toLocaleString()
                        : '0'}
                    </span>
                  </div>

                  {/* Fecha de fin */}
                  {subscription.endDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                        {formatDate(subscription.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Renovación automática */}
              {subscription.autoRenew && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    Renovación automática
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

