"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  userName?: string
}

export function DeleteUserDialog({ open, onOpenChange, onConfirm, userName }: DeleteUserDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            ¿Eliminar usuario?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {userName 
              ? `Estás a punto de eliminar el usuario "${userName}". Esta acción no se puede deshacer.`
              : "Estás a punto de eliminar este usuario. Esta acción no se puede deshacer."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

