"use client"

import { SalesSaleWithRelations } from "./types"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface SaleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale?: SalesSaleWithRelations
  onDelete: () => Promise<void>
}

export function SaleDeleteDialog({ open, onOpenChange, sale, onDelete }: SaleDeleteDialogProps) {
  const handleConfirm = async () => {
    await onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará la venta
            <strong className="block mt-2">
              "{sale?.saleNumber ?? 'Venta'}" por BOB {sale ? Number(sale.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '0.00'}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
