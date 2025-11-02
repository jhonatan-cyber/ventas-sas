"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Quotation } from "@prisma/client"

interface QuotationDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation?: Quotation & { customer?: any }
  onDelete: () => void
}

export function QuotationDeleteDialog({ open, onOpenChange, quotation, onDelete }: QuotationDeleteDialogProps) {
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Eliminar cotización</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Esta acción no se puede deshacer. Se eliminará permanentemente la cotización
            {quotation?.quotationNumber && (
              <span className="block font-semibold text-gray-900 dark:text-white mt-2">{quotation.quotationNumber}</span>
            )}
            junto a todos sus productos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center gap-3">
          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

