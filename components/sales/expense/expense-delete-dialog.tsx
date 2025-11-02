"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { SalesExpenseWithRelations } from "./types"

interface ExpenseDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: SalesExpenseWithRelations
  onDelete: () => void
}

export function ExpenseDeleteDialog({ open, onOpenChange, expense, onDelete }: ExpenseDeleteDialogProps) {
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el gasto
            <strong className="block mt-2">
              "{expense?.name ?? "Gasto"}" - BOB {expense ? Number(expense.amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

