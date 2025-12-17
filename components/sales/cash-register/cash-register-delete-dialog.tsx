"use client"

import type { CashRegisterWithRelations } from "./types"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface CashRegisterDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister?: CashRegisterWithRelations
  onDelete: () => void
}

export function CashRegisterDeleteDialog({ open, onOpenChange, cashRegister, onDelete }: CashRegisterDeleteDialogProps) {

const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{"Are You Sure"}</AlertDialogTitle>
          <AlertDialogDescription>
            {"Delete Warning"}
            <strong className="block mt-2">"{cashRegister?.name}"</strong>
            {"Delete Warning End"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">{"Cancelar"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            {"Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

