"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Package, DollarSign, Building2, Users, CheckCircle, Edit, Trash2, Power, PowerOff, MoreVertical, Eye } from "lucide-react"
import { SerializedSubscriptionPlanWithStats } from "./types"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface PlansCardsProps {
  plans: SerializedSubscriptionPlanWithStats[]
  onEdit?: (plan: SerializedSubscriptionPlanWithStats) => void
  onViewDetails?: (plan: SerializedSubscriptionPlanWithStats) => void
  onToggleStatus?: (planId: string, currentStatus: boolean) => void
  onDelete?: (planId: string, planName: string) => void
}

export function PlansCards({ plans, onEdit, onViewDetails, onToggleStatus, onDelete }: PlansCardsProps) {
  const canViewDetails = useHasPermission("planes_ver_detalles")
  const canEdit = useHasPermission("planes_editar")
  const canDelete = useHasPermission("planes_eliminar")
  const canActivate = useHasPermission("planes_activar")
  const canDeactivate = useHasPermission("planes_desactivar")
  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">No hay planes registrados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {plans.map((plan) => (
        <Card key={plan.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Header con nombre, badge y menú de acciones */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Package className="h-3 w-3 text-gray-500 dark:text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {plan.name}
                      </span>
                      <Badge
                        className={
                          plan.isActive
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-[10px] px-1 py-0.5 shrink-0'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 text-[10px] px-1 py-0.5 shrink-0'
                        }
                      >
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {plan.description && (
                      <div className="mt-0.5">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{plan.description}</span>
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
                      onClick={() => onViewDetails?.(plan)} 
                      className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canViewDetails}
                    >
                      <Eye className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">Ver detalles</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onEdit?.(plan)} 
                      className="cursor-pointer text-yellow-600 focus:text-yellow-600 dark:text-yellow-400 dark:focus:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canEdit}
                    >
                      <Edit className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400">Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus?.(plan.id, plan.isActive ?? false)}
                      className={`cursor-pointer ${
                        plan.isActive
                          ? 'text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400'
                          : 'text-green-600 focus:text-green-600 dark:text-green-400 dark:focus:text-green-400'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={
                        (plan.isActive && !canDeactivate) || 
                        (!plan.isActive && !canActivate)
                      }
                    >
                      {plan.isActive
                        ? <PowerOff className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                        : <Power className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      }
                      <span className={plan.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                        {plan.isActive ? 'Desactivar' : 'Activar'}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(plan.id, plan.name)}
                      className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={plan._count.organizations > 0 || !canDelete}
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
                  {/* Precio Mensual */}
                  {plan.hasMonthly && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold truncate">
                        {plan.priceMonthly && plan.priceMonthly > 0
                          ? `$${plan.priceMonthly.toLocaleString()}/mes`
                          : "Gratis"}
                      </span>
                    </div>
                  )}

                  {/* Organizaciones */}
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1 py-0"
                    >
                      {plan._count.organizations} orgs
                    </Badge>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-1.5">
                  {/* Precio Anual */}
                  {plan.hasYearly && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold truncate">
                        {plan.priceYearly && plan.priceYearly > 0
                          ? `$${plan.priceYearly.toLocaleString()}/año`
                          : "Gratis"}
                      </span>
                    </div>
                  )}

              {/* Límites */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    {plan.maxUsers ? plan.maxUsers.toLocaleString() : '∞'} usuarios
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    {plan.maxProducts ? plan.maxProducts.toLocaleString() : '∞'} productos
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                    {plan.maxBranches ? plan.maxBranches.toLocaleString() : '∞'} sucursales
                  </span>
                </div>
              </div>
            </div>
          </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

