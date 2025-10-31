"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description: React.ReactNode
  confirmText?: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  confirmColor?: 'red' | 'orange' | 'green'
}

export default function ConfirmActionDialog({ open, onOpenChange, title, description, onConfirm, confirmText = 'Confirmar', confirmColor = 'orange' }: ConfirmActionDialogProps) {
  const confirmClass = confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700 text-white' : confirmColor === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className={confirmClass} onClick={onConfirm}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


