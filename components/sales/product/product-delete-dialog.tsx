"use client"

import { SalesProduct, Category } from "@prisma/client"
import { useTranslations } from "next-intl"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface ProductDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: SalesProduct & { category: Category | null }
  onDelete: () => void
}

export function ProductDeleteDialog({ open, onOpenChange, product, onDelete }: ProductDeleteDialogProps) {
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
            {t('products.deleteWarning')}
            <strong className="block mt-2">"{product?.name}"</strong>
            {t('products.deleteWarningEnd')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3">
          <AlertDialogCancel className="rounded-full w-full sm:w-auto">{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-full sm:w-auto"
          >
            {t('action.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

