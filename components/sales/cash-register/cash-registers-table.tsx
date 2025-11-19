"use client"

import { Building2, Eye, Lock, Trash2, Unlock } from "lucide-react"
import { useTranslations } from "next-intl"


import type { CashRegisterWithRelations } from "./types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardsGridSkeleton } from "@/components/ui/cards-grid-skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrencyWithPreferences, formatDateWithPreferences } from "@/lib/utils/preferences"

interface CashRegistersTableProps {
  cashRegisters: CashRegisterWithRelations[]
  isLoading?: boolean
  onViewDetails?: (cashRegister: CashRegisterWithRelations) => void
  onOpenClick?: (cashRegister: CashRegisterWithRelations) => void
  onCloseClick?: (cashRegister: CashRegisterWithRelations) => void
  onDeleteClick?: (cashRegister: CashRegisterWithRelations) => void
  showBranchInfo?: boolean
}

const formatCurrency = (value: number | string | { toNumber?: () => number }) => {
  let numValue = 0
  if (value && typeof value === 'object' && 'toNumber' in value && value.toNumber) {
    numValue = value.toNumber()
  } else {
    numValue = Number(value || 0)
  }
  return formatCurrencyWithPreferences(numValue)
}

const getUserFullName = (user?: { nombre: string; apellido: string } | null) => {
  if (!user) return "-"
  const parts = [user.nombre ?? "", user.apellido ?? ""].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "-"
}

export function CashRegistersTable({
  cashRegisters,
  isLoading,
  onViewDetails,
  onOpenClick,
  onCloseClick,
  onDeleteClick,
  showBranchInfo = true,
}: CashRegistersTableProps) {
  const t = useTranslations()
  if (isLoading) {
    return <CardsGridSkeleton count={6} columns={3} />
  }

  if (cashRegisters.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
          <Lock className="h-10 w-10 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Sin cajas registradas</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crea una nueva caja para comenzar a registrar movimientos.</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cashRegisters.map((cashRegister) => {
          const isOpen = cashRegister.isOpen
          const statusClasses = isOpen
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800"

          const openedAt = cashRegister.lastOpenAt || cashRegister.createdAt
          const closedAt = cashRegister.lastCloseAt

          const openedBy = getUserFullName(cashRegister.openedBy || null)
          const closedBy = getUserFullName(cashRegister.closedBy || null)

          return (
            <div
              key={cashRegister.id}
              className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#1a1a1a] shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] hover:shadow-[0_28px_60px_-24px_rgba(15,23,42,0.45)] transition-shadow duration-300"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_80%,white)] via-[color-mix(in_oklch,var(--primary)_60%,white)] to-[color-mix(in_oklch,var(--primary)_80%,black)]" />

              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{cashRegister.name}</h3>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {formatDateWithPreferences(openedAt)}
                    </p>
                  </div>
                  <Badge className={`${statusClasses} rounded-full px-4 py-1.5 text-xs font-semibold`}>
                    {isOpen ? "Abierta" : "Cerrada"}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm">
                  {showBranchInfo && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500 dark:text-gray-400">Sucursal</span>
                      <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <Building2 className="h-4 w-4 text-[color-mix(in_oklch,var(--primary)_70%,white)]" />
                        {cashRegister.branch?.name || t('common.noBranch')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">Usuario de apertura</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right">{openedBy}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">Cerrada por</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right">{closedBy}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">Fecha de cierre</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {closedAt ? formatDateWithPreferences(closedAt) : "Aún sin cerrar"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl bg-gray-100/80 dark:bg-[#252525] px-3 py-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Monto de apertura</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(cashRegister.openingBalance)}</p>
                    </div>
                    <div className="rounded-2xl bg-green-100/80 dark:bg-green-900/20 px-3 py-3">
                      <p className="text-xs text-green-700 dark:text-green-300">Balance actual</p>
                      <p className="text-lg font-semibold text-green-700 dark:text-green-300">{formatCurrency(cashRegister.currentBalance)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        className="rounded-full px-4 py-2 text-sm font-semibold"
                        onClick={() => onViewDetails(cashRegister)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Ver detalle
                      </Button>
                    )}
                    {cashRegister.isOpen ? (
                      onCloseClick && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="rounded-full px-4 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-400/40"
                              onClick={() => onCloseClick(cashRegister)}
                            >
                              <Lock className="mr-2 h-4 w-4" /> Cerrar caja
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Cerrar caja</TooltipContent>
                        </Tooltip>
                      )
                    ) : (
                      onOpenClick && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              onClick={() => onOpenClick(cashRegister)}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Abrir caja</TooltipContent>
                        </Tooltip>
                      )
                    )}
                    {onDeleteClick && !cashRegister.isOpen && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            onClick={() => onDeleteClick(cashRegister)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar caja</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

