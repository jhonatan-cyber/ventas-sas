"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UsuarioSas } from "@prisma/client"

interface UsuarioSasDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: UsuarioSas & { rol?: any; sucursal?: any }
  onDelete: () => void
}

export function UsuarioSasDeleteDialog({ open, onOpenChange, usuario, onDelete }: UsuarioSasDeleteDialogProps) {
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  const fullName = usuario ? `${usuario.nombre} ${usuario.apellido}` : ""

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
            <strong className="block mt-2">"{fullName}"</strong>
            y todos sus datos asociados.
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

