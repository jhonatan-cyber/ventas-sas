"use client"

import { Plus, CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
import { Button } from "@/components/ui/button"
import { PermissionSasStats } from "@/lib/services/sales/permission-sas-service"

interface PermissionSasHeaderProps {
  title: string
  description: string
  stats: PermissionSasStats
  onNewClick?: () => void
  customerSlug: string
  onAssignAll?: () => void
}

export function PermissionSasHeader({ title, description, stats, onNewClick, customerSlug, onAssignAll }: PermissionSasHeaderProps) {
  const [assignDialog, setAssignDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAssignAll = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/${customerSlug}/permisos/assign-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al asignar permisos")
      }

      const data = await response.json()
      toast.success("Permisos asignados correctamente", {
        description: data.message,
      })

      setAssignDialog(false)
      onAssignAll?.()
    } catch (error: any) {
      console.error("Error al asignar permisos:", error)
      toast.error("Error al asignar permisos", {
        description: error.message || "No se pudieron asignar los permisos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onNewClick && (
            <Button
              onClick={onNewClick}
              variant="new"
              rounded="full"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Permiso
            </Button>
          )}
          <Button
            onClick={() => setAssignDialog(true)}
            variant="outline"
            rounded="full"
            className="w-full sm:w-auto"
            disabled={isLoading || stats.totalPermissions === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Asignar Todos
          </Button>
        </div>
      </div>

      {/* Dialog de confirmación para asignar */}
      <AlertDialog open={assignDialog} onOpenChange={setAssignDialog}>
        <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Asignar Todos los Permisos
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              ¿Estás seguro de que deseas asignar todos los permisos registrados ({stats.totalPermissions} permisos) a los roles "Administrador" y "Super Administrador"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 justify-center">
            <AlertDialogCancel
              onClick={() => setAssignDialog(false)}
              className="rounded-full"
              disabled={isLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignAll}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Asignar Todos
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

