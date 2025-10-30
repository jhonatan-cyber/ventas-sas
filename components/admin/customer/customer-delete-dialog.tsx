"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Customer } from "@/lib/types"

interface CustomerDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onDelete: () => void
}

export function CustomerDeleteDialog({ open, onOpenChange, customer, onDelete }: CustomerDeleteDialogProps) {
  if (!customer) return null

  const customerName = customer.nombre && customer.apellido
    ? `${customer.nombre} ${customer.apellido}`
    : customer.razonSocial || "este cliente"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            ¿Eliminar cliente?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            Esta acción no se puede deshacer. Se eliminará permanentemente la información de <strong>{customerName}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-4">
          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

