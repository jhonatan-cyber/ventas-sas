"use client"

import { useTranslations } from "next-intl"

import { Shield, Plus, CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
import { PermissionStats } from "@/lib/services/admin/permission-admin-service"

interface PermissionHeaderProps {
  title: string
  description: string
  stats: PermissionStats
  onNewClick?: () => void
  onAssignAll?: () => void
}

export function PermissionHeader({ title, description, stats, onNewClick, onAssignAll }: PermissionHeaderProps) {
  const t = useTranslations()
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
      toast.success(t('permissions.assignSuccess'), {
        description: data.message,
      })

      setAssignDialog(false)
      onAssignAll?.()
    } catch (error: any) {
      console.error("Error al asignar permisos:", error)
      toast.error(t('permissions.assignError'), {
        description: error.message || t('permissions.assignErrorDescription'),
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
              tooltipMessage={t('permissions.noPermissionToCreate')}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('permissions.create')}
            </PermissionButton>
          )}
          <PermissionButton
            permission="permisos_editar"
            onClick={() => setAssignDialog(true)}
            className="rounded-full"
            disabled={isLoading || stats.totalPermissions === 0}
            tooltipMessage={t('permissions.noPermissionToAssign')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('permissions.assignAll')}
          </PermissionButton>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('permissions.stats.total')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalPermissions}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('permissions.stats.inUse')}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.totalPermissions - stats.unusedPermissions.length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('permissions.stats.registered')}</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
            {stats.customPermissions}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('permissions.stats.unused')}</div>
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
              {t('permissions.assignAllTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {t('permissions.assignAllDescription', { count: stats.totalPermissions })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 justify-center">
            <AlertDialogCancel
              onClick={() => setAssignDialog(false)}
              className="rounded-full"
              disabled={isLoading}
            >
              {t('action.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignAll}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('permissions.assigning')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('permissions.assignAll')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

