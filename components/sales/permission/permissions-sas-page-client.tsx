"use client"

import { useTranslations } from "next-intl"

import { useState } from "react"
import { toast } from "sonner"

import { DeletePermissionSasDialog } from "./delete-permission-sas-dialog"
import { PermissionSasFormDialog } from "./permission-sas-form-dialog"
import { PermissionsSasContainer } from "./permissions-sas-container"

import { PermissionSasHeader } from "@/components/sales/permission/permission-sas-header"
import { PermissionSasInfo, PermissionSasStats } from "@/lib/services/sales/permission-sas-service"

interface PermissionsSasPageClientProps {
  initialPermissions: PermissionSasInfo[]
  initialStats: PermissionSasStats
  customerSlug: string
  maxBranches?: number | null
}

export function PermissionsSasPageClient({ initialPermissions, initialStats, customerSlug, maxBranches }: PermissionsSasPageClientProps) {
  const t = useTranslations()
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<PermissionSasInfo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [permissions, setPermissions] = useState(initialPermissions)
  const [stats, setStats] = useState(initialStats)

  const handleNewClick = () => {
    setOpenDialog(true)
  }

  const handleSuccess = async () => {
    await reloadData()
  }

  const reloadData = async () => {
    // Recargar permisos y estadísticas
    try {
      const [permissionsRes, statsRes] = await Promise.all([
        fetch(`/api/${customerSlug}/permisos`),
        fetch(`/api/${customerSlug}/permisos/stats`),
      ])

      if (permissionsRes.ok && statsRes.ok) {
        const [newPermissions, newStats] = await Promise.all([
          permissionsRes.json(),
          statsRes.json(),
        ])
        setPermissions(newPermissions)
        setStats(newStats)
      }
    } catch (error) {
      console.error("Error al recargar permisos:", error)
    }
  }

  const handleDeleteClick = (permission: PermissionSasInfo) => {
    setSelectedPermission(permission)
    setDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPermission) return

    setIsDeleting(true)
    try {
      const encodedName = encodeURIComponent(selectedPermission.name)
      const response = await fetch(`/api/${customerSlug}/permisos/${encodedName}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el permiso")
      }

      const data = await response.json()
      toast.success(t('permissions.sas.deleteSuccess'), {
        description: data.message,
      })

      setDeleteDialog(false)
      setSelectedPermission(null)
      await reloadData()
    } catch (error: any) {
      console.error("Error al eliminar permiso:", error)
      toast.error(t('permissions.sas.deleteError'), {
        description: error.message || t('permissions.sas.deleteErrorDescription'),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (permission: PermissionSasInfo) => {
    const currentStatus = permission.isActive ?? true
    const newStatus = !currentStatus
    
    // Actualizar estado local inmediatamente para feedback visual
    setPermissions((prevPermissions) =>
      prevPermissions.map((p) =>
        p.name === permission.name ? { ...p, isActive: newStatus } : p
      )
    )
    
    try {
      const encodedName = encodeURIComponent(permission.name)
      const response = await fetch(`/api/${customerSlug}/permisos/${encodedName}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        // Revertir cambio local si falla
        setPermissions((prevPermissions) =>
          prevPermissions.map((p) =>
            p.name === permission.name ? { ...p, isActive: !newStatus } : p
          )
        )
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado del permiso")
      }

      const data = await response.json()
      toast.success(t('permissions.sas.toggleStatusSuccess'), {
        description: data.message,
      })

      // Recargar datos para sincronizar con el servidor
      await reloadData()
    } catch (error: any) {
      console.error("Error al cambiar estado del permiso:", error)
      toast.error(t('permissions.sas.toggleStatusError'), {
        description: error.message || t('permissions.sas.toggleStatusErrorDescription'),
      })
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6 overflow-x-hidden max-w-full">
      {/* Header con título */}
      <PermissionSasHeader
        title={t('permissions.title')}
        description={t('permissions.description')}
        stats={stats}
        onNewClick={handleNewClick}
        customerSlug={customerSlug}
        onAssignAll={reloadData}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <PermissionsSasContainer
        permissions={permissions}
        onDelete={handleDeleteClick}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modal de registro de permisos */}
      <PermissionSasFormDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSuccess={handleSuccess}
        customerSlug={customerSlug}
        maxBranches={maxBranches}
      />

      {/* Modal de confirmación para eliminar */}
      <DeletePermissionSasDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        permission={selectedPermission}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  )
}

