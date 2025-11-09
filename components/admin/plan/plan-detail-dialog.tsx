"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  DollarSign,
  Building2,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Infinity,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SerializedSubscriptionPlanWithStats } from "./types"

interface PlanDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SerializedSubscriptionPlanWithStats | null
}

export function PlanDetailDialog({
  open,
  onOpenChange,
  plan,
}: PlanDetailDialogProps) {
  if (!plan) return null

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(amount)
  }

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
                <span className="text-xl font-bold">{plan.name}</span>
                <Badge
                  className={
                    plan.isActive
                      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                      : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
                  }
                >
                  {plan.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Información detallada del plan de suscripción
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Información General */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-4 w-4" />
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nombre del Plan
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {plan.name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <div className="flex items-center gap-2">
                  {plan.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <Badge
                    className={
                      plan.isActive
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                        : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
                    }
                  >
                    {plan.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              {plan.description && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Descripción
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {plan.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Precios */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Precios y Períodos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              {plan.hasMonthly && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Precio Mensual
                  </p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {plan.priceMonthly && plan.priceMonthly > 0
                        ? `${formatCurrency(plan.priceMonthly)} / mes`
                        : "Gratis"}
                    </p>
                  </div>
                </div>
              )}
              {plan.hasYearly && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Precio Anual
                  </p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {plan.priceYearly && plan.priceYearly > 0
                        ? `${formatCurrency(plan.priceYearly)} / año`
                        : "Gratis"}
                    </p>
                  </div>
                </div>
              )}
              {!plan.hasMonthly && !plan.hasYearly && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Períodos Disponibles
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Sin períodos configurados
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Límites */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Límites del Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Máximo de Usuarios
                </p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {plan.maxUsers ? (
                      plan.maxUsers.toLocaleString()
                    ) : (
                      <span className="flex items-center gap-1">
                        <Infinity className="h-4 w-4" />
                        Ilimitado
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Máximo de Productos
                </p>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {plan.maxProducts ? (
                      plan.maxProducts.toLocaleString()
                    ) : (
                      <span className="flex items-center gap-1">
                        <Infinity className="h-4 w-4" />
                        Ilimitado
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {plan.maxOrders !== undefined && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Máximo de Pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {plan.maxOrders ? (
                        plan.maxOrders.toLocaleString()
                      ) : (
                        <span className="flex items-center gap-1">
                          <Infinity className="h-4 w-4" />
                          Ilimitado
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Estadísticas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Estadísticas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Organizaciones Activas
                </p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    {plan._count.organizations} organización
                    {plan._count.organizations !== 1 ? "es" : ""}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Fechas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Información de Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Plan creado
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(plan.createdAt)}
                  </p>
                </div>
              </div>
              {plan.updatedAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Última actualización
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(plan.updatedAt)}
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

