"use client"

import { SalesSaleWithRelations } from "./types"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface SaleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale?: SalesSaleWithRelations
  customerSlug: string
  onDelete: () => Promise<void>
}

export function SaleDeleteDialog({ open, onOpenChange, sale, customerSlug, onDelete }: SaleDeleteDialogProps) {
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
            Esta acción no se puede deshacer. La venta será eliminada permanentemente.
            <strong className="block mt-2">
              "{sale?.saleNumber ?? 'Venta'}" por {sale ? formatCurrencyWithPreferences(Number(sale.total || 0), customerSlug) : '0.00'}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <AlertDialogCancel className="w-full sm:w-auto rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto rounded-full" onClick={handleConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
