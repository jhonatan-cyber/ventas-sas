"use client"

import { RoleSas } from "@prisma/client"
import { useTranslations } from "next-intl"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface RoleSasDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleSas & { customer?: any; sucursal?: any }
  onDelete: () => void
}

export function RoleSasDeleteDialog({ open, onOpenChange, role, onDelete }: RoleSasDeleteDialogProps) {
  const t = useTranslations()
  const isAdminRole = (role?.nombre || '').toLowerCase() === 'administrador'
  const handleDelete = () => {
    if (isAdminRole) return
    onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAdminRole ? t('roles.sas.delete.cannotDelete') : t('roles.sas.delete.confirm')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAdminRole ? (
              <span dangerouslySetInnerHTML={{ __html: t('roles.sas.delete.cannotDeleteDescription') }} />
            ) : (
              <>
                {t('roles.sas.delete.description')}
                <strong className="block mt-2">"{role?.nombre}"</strong>
                {" y "}
                <strong>se desactivará</strong>
                {" a los usuarios que tengan asignado este rol."}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3">
          <AlertDialogCancel className="rounded-full w-full sm:w-auto">{t('action.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-full sm:w-auto"
            disabled={isAdminRole}
          >
            {t('action.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

