"use client"

import type { CashRegisterWithRelations } from "./types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/utils/date"

const formatCurrency = (value: number | string | undefined | null | { toNumber?: () => number }) => {
  let numValue = 0
  if (value && typeof value === 'object' && 'toNumber' in value && value.toNumber) {
    numValue = value.toNumber()
  } else {
    numValue = Number(value || 0)
  }
  return `$${numValue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
}

interface CashRegisterDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister: CashRegisterWithRelations | null
  showBranchInfo?: boolean
}

const getUserFullName = (user?: { nombre: string; apellido: string } | null) => {
  if (!user) return "-"
  const parts = [user.nombre ?? "", user.apellido ?? ""].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "-"
}

export function CashRegisterDetailsDialog({ open, onOpenChange, cashRegister, showBranchInfo = true }: CashRegisterDetailsDialogProps) {
  const isOpen = cashRegister?.isOpen ?? false
  const openedAt = cashRegister?.lastOpenAt || cashRegister?.createdAt
  const closedAt = cashRegister?.lastCloseAt

  const statusClasses = isOpen
    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
    : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Detalles de la caja</DialogTitle>
          <DialogDescription>
            Información resumida del estado actual de la caja registradora.
          </DialogDescription>
        </DialogHeader>

        {cashRegister ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cashRegister.name}</h3>
                {openedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(openedAt)}</p>
                )}
              </div>
              <Badge className={`${statusClasses} rounded-full px-4 py-1.5 text-xs font-semibold`}>
                {isOpen ? "Abierta" : "Cerrada"}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              {showBranchInfo && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500 dark:text-gray-400">Sucursal</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {cashRegister.branch?.name || "Sin sucursal"}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Usuario de apertura</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {getUserFullName(cashRegister.openedBy || null)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Cerrada por</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {getUserFullName(cashRegister.closedBy || null)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Fecha de cierre</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {closedAt ? formatDateTime(closedAt) : "Aún sin cerrar"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-gray-100/80 dark:bg-[#252525] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monto de apertura</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(cashRegister.openingBalance)}
                  </p>
                </div>
                <div className="rounded-2xl bg-green-100/80 dark:bg-green-900/20 px-3 py-3">
                  <p className="text-xs text-green-700 dark:text-green-300">Balance actual</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {formatCurrency(cashRegister.currentBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona una caja para ver sus detalles.
          </p>
        )}

        <DialogFooter className="justify-center">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
