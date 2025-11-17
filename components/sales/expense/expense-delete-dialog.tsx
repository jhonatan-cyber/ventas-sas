"use client"

import { useTranslations } from "next-intl"

import { SalesExpenseWithRelations } from "./types"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface ExpenseDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: SalesExpenseWithRelations
  customerSlug: string
  onDelete: () => void
}

export function ExpenseDeleteDialog({ open, onOpenChange, expense, customerSlug, onDelete }: ExpenseDeleteDialogProps) {
  const t = useTranslations()
  
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('expenses.deleteWarning')}
            <strong className="block mt-2">
              "{expense?.name ?? t('expenses.expense')}" - {expense ? formatCurrencyWithPreferences(Number(expense.amount), customerSlug) : '0.00'}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full"
          >
            {t('action.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

