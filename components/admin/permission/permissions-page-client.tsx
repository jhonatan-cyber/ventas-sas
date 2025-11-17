"use client"

import { useTranslations } from "next-intl"

import { useState } from "react"
import { toast } from "sonner"

import { DeletePermissionDialog } from "./delete-permission-dialog"
import { PermissionFormDialog } from "./permission-form-dialog"
import { PermissionsContainer } from "./permissions-container"

import { PermissionHeader } from "@/components/admin/permission/permission-header"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PermissionInfo, PermissionStats } from "@/lib/services/admin/permission-admin-service"

interface PermissionsPageClientProps {
  initialPermissions: PermissionInfo[]
  initialStats: PermissionStats
}

export function PermissionsPageClient({ initialPermissions, initialStats }: PermissionsPageClientProps) {
  const t = useTranslations()
  const [openDialog, setOpenDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<PermissionInfo | null>(null)
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
        fetch("/api/administracion/permisos"),
        fetch("/api/administracion/permisos/stats"),
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

  const handleDeleteClick = (permission: PermissionInfo) => {
    setSelectedPermission(permission)
    setDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPermission) return

    setIsDeleting(true)
    try {
      const encodedName = encodeURIComponent(selectedPermission.name)
      const response = await fetch(`/api/administracion/permisos/${encodedName}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el permiso")
      }

      const data = await response.json()
      toast.success(t('permissions.deleteSuccess'), {
        description: data.message,
      })

      setDeleteDialog(false)
      setSelectedPermission(null)
      await reloadData()
    } catch (error: any) {
      console.error("Error al eliminar permiso:", error)
      toast.error(t('permissions.deleteError'), {
        description: error.message || t('permissions.deleteErrorDescription'),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (permission: PermissionInfo) => {
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
      const response = await fetch(`/api/administracion/permisos/${encodedName}/toggle-status`, {
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
      toast.success(t('permissions.toggleStatusSuccess'), {
        description: data.message,
      })

      // Recargar datos para sincronizar con el servidor
      await reloadData()
    } catch (error: any) {
      console.error("Error al cambiar estado del permiso:", error)
      toast.error(t('permissions.toggleStatusError'), {
        description: error.message || t('permissions.toggleStatusErrorDescription'),
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header con título */}
        <PermissionHeader
          title={t('permissions.title')}
          description={t('permissions.description')}
          stats={stats}
          onNewClick={handleNewClick}
          onAssignAll={reloadData}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <PermissionsContainer
          permissions={permissions}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
        />

        {/* Modal de registro de permisos */}
        <PermissionFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          onSuccess={handleSuccess}
        />

        {/* Modal de confirmación para eliminar */}
        <DeletePermissionDialog
          open={deleteDialog}
          onOpenChange={setDeleteDialog}
          permission={selectedPermission}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
        />
      </div>
    </AdminLayout>
  )
}

