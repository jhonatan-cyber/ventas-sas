"use client"

import type { CashRegisterWithRelations } from "./types"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface CashRegisterCloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegisterWithRelations
  onClose: () => void
}

export function CashRegisterCloseDialog({ open, onOpenChange, cashRegister, onClose }: CashRegisterCloseDialogProps) {
  const handleClose = () => {
    onClose()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <AlertDialogHeader className="sticky top-0 z-10 px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <AlertDialogTitle className="text-xl font-semibold">¿Cerrar caja?</AlertDialogTitle>
        </AlertDialogHeader>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Estás a punto de cerrar la caja <span className="font-semibold">"{cashRegister?.name}"</span>.
              </p>
              <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-4 space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance actual:</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${cashRegister ? (() => {
                    const balance = cashRegister.currentBalance && typeof cashRegister.currentBalance === 'object' && 'toNumber' in cashRegister.currentBalance
                      ? cashRegister.currentBalance.toNumber()
                      : Number(cashRegister.currentBalance || 0)
                    return balance.toLocaleString('es-BO', { minimumFractionDigits: 2 })
                  })() : '0.00'}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                La caja no podrá recibir más movimientos hasta que se vuelva a abrir.
              </p>
            </div>
          </AlertDialogDescription>
        </div>

        {/* Footer estático */}
        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <AlertDialogCancel className="rounded-full w-full sm:w-auto">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            className="rounded-full w-full sm:w-auto"
          >
            Cerrar Caja
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

