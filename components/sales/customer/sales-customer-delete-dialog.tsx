"use client"

import { SalesCustomer } from "@prisma/client"
import { useTranslations } from "next-intl"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface SalesCustomerDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: SalesCustomer
  onDelete: () => void
}

export function SalesCustomerDeleteDialog({ open, onOpenChange, customer, onDelete }: SalesCustomerDeleteDialogProps) {
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
            {t('customers.deleteWarning')}
            <strong className="block mt-2">"{`${customer?.name ?? ""} ${(customer as any)?.lastName ?? ""}`.trim()}"</strong>
            {t('customers.deleteWarningEnd')}
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

