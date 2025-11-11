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
import { PermissionSasInfo } from "@/lib/services/sales/permission-sas-service"

interface DeletePermissionSasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission: PermissionSasInfo | null
  onConfirm: () => void
  isLoading?: boolean
}

export function DeletePermissionSasDialog({
  open,
  onOpenChange,
  permission,
  onConfirm,
  isLoading = false,
}: DeletePermissionSasDialogProps) {
  if (!permission) return null

  const hasRoles = permission.roleCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            ¿Eliminar permiso?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {hasRoles ? (
              <>
                Estás a punto de eliminar el permiso <strong className="font-mono text-gray-900 dark:text-white">{permission.name}</strong>.
                <br />
                <br />
                Este permiso está asignado a <strong>{permission.roleCount}</strong> rol(es):{" "}
                <strong>{permission.roles.join(", ")}</strong>.
                <br />
                <br />
                El permiso será eliminado de todos los roles. Esta acción no se puede deshacer.
              </>
            ) : (
              <>
                Estás a punto de eliminar el permiso <strong className="font-mono text-gray-900 dark:text-white">{permission.name}</strong>.
                <br />
                <br />
                Este permiso no está asignado a ningún rol. Esta acción no se puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 justify-center">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full"
            disabled={isLoading}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-full"
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

