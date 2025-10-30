"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CashRegister } from "@prisma/client"

interface CashRegisterCloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegister
  onClose: () => void
}

export function CashRegisterCloseDialog({ open, onOpenChange, cashRegister, onClose }: CashRegisterCloseDialogProps) {
  const handleClose = () => {
    onClose()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cerrar caja?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de cerrar la caja "{cashRegister?.name}".
            <div className="mt-2 space-y-1">
              <p className="font-medium">Balance actual:</p>
              <p className="text-lg text-gray-900 dark:text-white">
                ${cashRegister ? Number(cashRegister.currentBalance).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '0.00'}
              </p>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              La caja no podrá recibir más movimientos hasta que se vuelva a abrir.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Cerrar Caja
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

