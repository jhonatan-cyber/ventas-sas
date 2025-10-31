"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { RoleSas } from "@prisma/client"

interface RoleSasDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleSas & { customer?: any; sucursal?: any }
  onDelete: () => void
}

export function RoleSasDeleteDialog({ open, onOpenChange, role, onDelete }: RoleSasDeleteDialogProps) {
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
          <AlertDialogTitle>{isAdminRole ? 'No se puede eliminar' : '¿Estás seguro?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdminRole ? (
              <>
                El rol <strong>Administrador</strong> no puede eliminarse por seguridad del sistema.
              </>
            ) : (
              <>
                Esta acción no se puede deshacer. Se eliminará permanentemente el rol
                <strong className="block mt-2">"{role?.nombre}"</strong>
                y <strong>se desactivará</strong> a los usuarios que tengan asignado este rol.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isAdminRole}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

