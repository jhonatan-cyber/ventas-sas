"use client"

import { useState } from "react"
import { toast } from "sonner"


import { DeletePermissionSasDialog } from "./delete-permission-sas-dialog"
import { PermissionSasFormDialog } from "./permission-sas-form-dialog"
import { PermissionsSasContainer } from "./permissions-sas-container"

import { PermissionSasHeader } from "@/components/sales/permission/permission-sas-header"
import { useSasPermissions } from "@/hooks/sales/use-sas-permissions"
import { PermissionSasInfo, PermissionSasStats } from "@/lib/services/sales/permission-sas-service"

interface PermissionsSasPageClientProps {
  initialPermissions: PermissionSasInfo[]
  initialStats: PermissionSasStats
  customerSlug: string
  maxBranches?: number | null
}

export function PermissionsSasPageClient({ initialPermissions, initialStats, customerSlug, maxBranches }: PermissionsSasPageClientProps) {
  // Hook para verificar permisos del usuario
  const { hasPermission } = useSasPermissions()
  
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
      toast.success('Permiso eliminado correctamente', {
        description: data.message,
      })

      setDeleteDialog(false)
      setSelectedPermission(null)
      await reloadData()
    } catch (error: any) {
      console.error("Error al eliminar permiso:", error)
      toast.error('Error al eliminar permiso', {
        description: error.message || 'No se pudo eliminar el permiso',
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
      toast.success('Estado del permiso actualizado', {
        description: data.message,
      })

      // Recargar datos para sincronizar con el servidor
      await reloadData()
    } catch (error: any) {
      console.error("Error al cambiar estado del permiso:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo cambiar el estado del permiso',
      })
    }
  }

  // Verificar permisos para mostrar botones de acciones
  const canCreatePermission = hasPermission('permisos_crear')
  const _canEditPermission = false
  const canDeletePermission = hasPermission('permisos_eliminar')
  const canTogglePermissionStatus = hasPermission('permisos_activar') || hasPermission('permisos_desactivar')

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6 overflow-x-hidden max-w-full">
      {/* Header con título */}
      <PermissionSasHeader
        title="Gestión de Permisos"
        description="Administra los permisos del sistema y su asignación a roles"
        stats={stats}
        onNewClick={canCreatePermission ? handleNewClick : undefined}
        customerSlug={customerSlug}
        onAssignAll={reloadData}
        showNewButton={canCreatePermission}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <PermissionsSasContainer
        permissions={permissions}
        onDelete={canDeletePermission ? handleDeleteClick : undefined}
        onToggleStatus={canTogglePermissionStatus ? handleToggleStatus : undefined}
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

