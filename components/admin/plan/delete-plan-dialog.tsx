"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface DeletePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  planName?: string
}

export function DeletePlanDialog({ open, onOpenChange, onConfirm, planName }: DeletePlanDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            ¿Eliminar plan?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {planName 
              ? `Estás a punto de eliminar el plan "${planName}". Esta acción no se puede deshacer.`
              : "Estás a punto de eliminar este plan. Esta acción no se puede deshacer."
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

