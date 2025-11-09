"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface ToggleStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  roleName?: string
  currentStatus: boolean
}

export function ToggleStatusDialog({ open, onOpenChange, onConfirm, roleName, currentStatus }: ToggleStatusDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const action = currentStatus ? "desactivar" : "activar"
  const actionCapitalized = currentStatus ? "Desactivar" : "Activar"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            ¿{actionCapitalized} rol?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {roleName 
              ? `Estás a punto de ${action} el rol "${roleName}". ${currentStatus ? "Los usuarios con este rol no podrán acceder al sistema." : "Los usuarios con este rol podrán acceder nuevamente al sistema."}`
              : `Estás a punto de ${action} este rol. ${currentStatus ? "Los usuarios con este rol no podrán acceder al sistema." : "Los usuarios con este rol podrán acceder nuevamente al sistema."}`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 justify-center">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`w-full sm:w-auto rounded-full ${
              currentStatus 
                ? "bg-orange-600 hover:bg-orange-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {actionCapitalized}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

