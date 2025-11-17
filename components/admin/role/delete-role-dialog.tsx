"use client"

import { useTranslations } from "next-intl"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  roleName?: string
}

export function DeleteRoleDialog({ open, onOpenChange, onConfirm, roleName }: DeleteRoleDialogProps) {
  const t = useTranslations()
  
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            {t('roles.deleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {roleName 
              ? `${t('roles.deleteWarning')} "${roleName}". ${t('roles.deleteWarningEnd')}`
              : t('roles.deleteWarningNoName')
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 justify-center">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full"
          >
            {t('action.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-full"
          >
            {t('action.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

