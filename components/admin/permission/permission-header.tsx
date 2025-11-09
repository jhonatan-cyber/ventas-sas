"use client"

import { Shield, Plus, CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PermissionStats } from "@/lib/services/admin/permission-admin-service"
import { PermissionButton } from "@/components/admin/common/permission-guard"
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

interface PermissionHeaderProps {
  title: string
  description: string
  stats: PermissionStats
  onNewClick?: () => void
  onAssignAll?: () => void
}

export function PermissionHeader({ title, description, stats, onNewClick, onAssignAll }: PermissionHeaderProps) {
  const [assignDialog, setAssignDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAssignAll = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/administracion/permisos/assign-all", {
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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            {title}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onNewClick && (
            <PermissionButton
              permission="permisos_crear"
              onClick={onNewClick}
              variant="outline"
              className="rounded-full"
              tooltipMessage="No tiene permiso para crear permisos"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Permiso
            </PermissionButton>
          )}
          <PermissionButton
            permission="permisos_editar"
            onClick={() => setAssignDialog(true)}
            className="rounded-full"
            disabled={isLoading || stats.totalPermissions === 0}
            tooltipMessage="No tiene permiso para asignar permisos"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Asignar Todos
          </PermissionButton>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Permisos</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalPermissions}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">En Uso</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.totalPermissions - stats.unusedPermissions.length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Registrados</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
            {stats.customPermissions}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">No Usados</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {stats.unusedPermissions.length}
          </div>
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
    </div>
  )
}

