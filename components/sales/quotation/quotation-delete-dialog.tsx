"use client"

import { useTranslations } from "next-intl"

import { SalesQuotationWithRelations } from "./types"

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


interface QuotationDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation?: SalesQuotationWithRelations | null
  onDelete: () => void
}

export function QuotationDeleteDialog({ open, onOpenChange, quotation, onDelete }: QuotationDeleteDialogProps) {
  const t = useTranslations()
  
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{t('quotations.delete.confirm')}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {t('quotations.delete.description')}
            {quotation?.quotationNumber && (
              <span className="block font-semibold text-gray-900 dark:text-white mt-2">{quotation.quotationNumber}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center gap-3">
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

