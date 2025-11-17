"use client"

import { useTranslations } from "next-intl"

import type { CashRegisterWithRelations } from "./types"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface CashRegisterDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegisterWithRelations
  onDelete: () => void
}

export function CashRegisterDeleteDialog({ open, onOpenChange, cashRegister, onDelete }: CashRegisterDeleteDialogProps) {
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
            {t('cashRegisters.deleteWarning')}
            <strong className="block mt-2">"{cashRegister?.name}"</strong>
            {t('cashRegisters.deleteWarningEnd')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            {t('action.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

