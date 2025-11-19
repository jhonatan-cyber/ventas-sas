"use client"

import { Branch } from "@prisma/client"
import { useTranslations } from "next-intl"


import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface BranchDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Branch
  onDelete: () => void
}

export function BranchDeleteDialog({ open, onOpenChange, branch, onDelete }: BranchDeleteDialogProps) {
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
            {t('branches.deleteWarning')}
            <strong className="block mt-2">"{branch?.name}"</strong>
            {t('branches.deleteWarningEnd')}
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

