"use client"

import {
  Building2,
  User,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  RefreshCw,
} from "lucide-react"

import type { SubscriptionWithDetails } from "./types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface SubscriptionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: SubscriptionWithDetails | null
}

export function SubscriptionDetailDialog({
  open,
  onOpenChange,
  subscription,
}: SubscriptionDetailDialogProps) {
  if (!subscription) return null

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    const d = new Date(date)
    const year = d.getUTCFullYear()
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = d.getUTCDate().toString().padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " Bs"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
      case "expired":
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
      case "trial":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activa"
      case "cancelled":
        return "Cancelada"
      case "expired":
        return "Expirada"
      case "trial":
        return "Prueba"
      default:
        return status
    }
  }

  const getBillingPeriodLabel = (period: string) => {
    return period === "monthly" ? "Mensual" : "Anual"
  }

  const planPrice = subscription.billingPeriod === "monthly"
    ? subscription.plan.priceMonthly
    : subscription.plan.priceYearly

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold">
                  {subscription.organization?.razonSocial || subscription.organization?.name || "Suscripción"}
                </span>
                <Badge className={getStatusColor(subscription.status)}>
                  {getStatusLabel(subscription.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Plan: {subscription.plan.name}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Información detallada de la suscripción
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Información de la Organización */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Información de la Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nombre
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={subscription.organization?.whiteLabelBranding?.logoUrl || undefined}
                      alt={subscription.organization?.razonSocial || subscription.organization?.name || "Empresa"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                      {(subscription.organization?.razonSocial || subscription.organization?.name || "E").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.organization?.razonSocial || subscription.organization?.name || "N/A"}
                  </p>
                </div>
              </div>
              {subscription.organization?.nit && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    NIT
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.organization.nit}
                  </p>
                </div>
              )}
              {subscription.organization?.slug && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Slug
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.organization.slug}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del Cliente */}
          {subscription.customer && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nombre Completo
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {`${subscription.customer.nombre || ""} ${subscription.customer.apellido || ""}`.trim() || "N/A"}
                    </p>
                  </div>
                  {subscription.customer.email && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Email
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {subscription.customer.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Información del Plan */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-4 w-4" />
              Información del Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nombre del Plan
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subscription.plan.name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Período de Facturación
                </p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <Badge variant="outline">
                    {getBillingPeriodLabel(subscription.billingPeriod)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Precio
                </p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {planPrice ? formatCurrency(planPrice) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Estado y Configuración */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Estado y Configuración
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <div className="flex items-center gap-2">
                  {subscription.status === "active" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <Badge className={getStatusColor(subscription.status)}>
                    {getStatusLabel(subscription.status)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Renovación Automática
                </p>
                <div className="flex items-center gap-2">
                  {subscription.autoRenew ? (
                    <>
                      <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                        Activa
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800">
                        Inactiva
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fechas de Vigencia */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas de Vigencia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha de Inicio
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fecha de Fin
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.endDate ? formatDate(subscription.endDate) : "Sin fecha de fin"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Fechas del Sistema */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Información del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suscripción creada
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.createdAt)}
                  </p>
                </div>
              </div>
              {subscription.updatedAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Última actualización
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

