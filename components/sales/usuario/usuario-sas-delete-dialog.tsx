"use client"

import { UsuarioSas } from "@prisma/client"
import { useTranslations } from "next-intl"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface UsuarioSasDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: UsuarioSas & { rol?: any; sucursal?: any }
  onDelete: () => void
}

export function UsuarioSasDeleteDialog({ open, onOpenChange, usuario, onDelete }: UsuarioSasDeleteDialogProps) {
  const t = useTranslations()
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  const fullName = usuario ? `${usuario.nombre} ${usuario.apellido}` : ""

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('users.sas.delete.confirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('users.sas.delete.description')}
            <strong className="block mt-2">"{fullName}"</strong>
            {t('users.sas.delete.descriptionEnd')}
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

