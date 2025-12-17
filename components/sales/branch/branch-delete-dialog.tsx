"use client"

import { Branch } from "@prisma/client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface BranchDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Branch
  onDelete: () => void
}

export function BranchDeleteDialog({ open, onOpenChange, branch, onDelete }: BranchDeleteDialogProps) {

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
            <strong className="block mt-2">"{branch?.name}"</strong>
            {"Delete Warning End"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3">
          <AlertDialogCancel className="rounded-full w-full sm:w-auto">{"Cancelar"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-full sm:w-auto"
          >
            {"Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

