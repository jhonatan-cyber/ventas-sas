"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Edit, Trash2, Power, PowerOff, DollarSign, Users } from "lucide-react"
import { SerializedSubscriptionPlanWithStats } from "./types"

interface PlansTableProps {
  plans: SerializedSubscriptionPlanWithStats[]
  onEdit?: (plan: SerializedSubscriptionPlanWithStats) => void
  onToggleStatus?: (planId: string, currentStatus: boolean) => void
  onDelete?: (planId: string, planName: string) => void
}

export function PlansTable({ plans, onEdit, onToggleStatus, onDelete }: PlansTableProps) {
  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-[#2a2a2a]">
            <TableHead className="text-gray-700 dark:text-gray-300">Plan</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Precio</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Organizaciones</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Límites</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Estado</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay planes registrados
              </TableCell>
            </TableRow>
          ) : (
            plans.map((plan) => (
              <TableRow key={plan.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  <div>
                    <div className="font-semibold">{plan.name}</div>
                    {plan.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {plan.hasMonthly && plan.priceMonthly && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${plan.priceMonthly.toLocaleString()} 
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/mes</span>
                      </div>
                    )}
                    {plan.hasYearly && plan.priceYearly && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${plan.priceYearly.toLocaleString()} 
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/año</span>
                      </div>
                    )}
                    {!plan.hasMonthly && !plan.hasYearly && (
                      <span className="text-sm text-gray-400">Sin precios</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {plan._count.organizations} orgs
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {plan.maxUsers ? plan.maxUsers.toLocaleString() : '∞'} usuarios
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {plan.maxProducts ? plan.maxProducts.toLocaleString() : '∞'} productos
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      plan.isActive 
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                    }
                  >
                    {plan.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalles</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          onClick={() => onEdit?.(plan)}
                        >
                          <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar plan</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${
                            plan.isActive 
                              ? "hover:bg-orange-50 dark:hover:bg-orange-900/20" 
                              : "hover:bg-green-50 dark:hover:bg-green-900/20"
                          }`}
                          onClick={() => onToggleStatus?.(plan.id, plan.isActive ?? false)}
                        >
                          {plan.isActive 
                            ? <PowerOff className="h-4 w-4 text-orange-600 dark:text-orange-400" /> 
                            : <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                          }
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {plan.isActive ? "Desactivar plan" : "Activar plan"}
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                          disabled={plan._count.organizations > 0}
                          onClick={() => onDelete?.(plan.id, plan.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {plan._count.organizations > 0 
                          ? "No se puede eliminar: tiene organizaciones asignadas" 
                          : "Eliminar plan"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}

