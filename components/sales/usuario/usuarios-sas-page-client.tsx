"use client"

import { UsuarioSas, RoleSas } from "@prisma/client"
import { useState, useEffect } from "react"

import { UsuarioSasDeleteDialog } from "./usuario-sas-delete-dialog"
import { UsuarioSasDetailDialog } from "./usuario-sas-detail-dialog"
import { UsuarioSasFormDialog } from "./usuario-sas-form-dialog"
import { UsuariosSasContainer } from "./usuarios-sas-container"
import { UsuariosSasHeader } from "./usuarios-sas-header"

import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog"
import { useSasPermissions } from "@/hooks/sales/use-sas-permissions"
import { useUsuarioSasActions } from "@/hooks/sales/usuario/use-usuario-sas-actions"

interface UsuariosSasPageClientProps {
  initialUsuarios: (UsuarioSas & {
    rol?: { id: string; nombre: string } | null
    sucursal?: { id: string; name: string } | null
    customer?: any
  })[]
  roles: (RoleSas & { customer?: any; sucursal?: any })[]
  sucursales: { id: string; name: string }[]
  customerSlug: string
  maxUsers?: number | null
}

export function UsuariosSasPageClient({ 
  initialUsuarios, 
  roles, 
  sucursales, 
  customerSlug,
  maxUsers
}: UsuariosSasPageClientProps) {
  const [usuarios, setUsuarios] = useState(initialUsuarios)
  
  // Hook para verificar permisos del usuario
  const { hasPermission } = useSasPermissions()
  
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailDialogOpen,
    selectedUsuario,
    confirmOpen,
    confirmTitle,
    confirmDesc,
    confirmColor,
    confirmPerform,
    setConfirmOpen,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openViewDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useUsuarioSasActions(customerSlug, setUsuarios)

  // Actualizar usuarios cuando cambien los initialUsuarios (después de router.refresh)
  useEffect(() => {
    setUsuarios(initialUsuarios)
  }, [initialUsuarios])

  // Escuchar eventos de actualización de usuario para actualizar la tabla si el usuario está en la lista
  useEffect(() => {
    const handleUserUpdated = (event: CustomEvent) => {
      const updatedUser = event.detail
      if (updatedUser) {
        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((usuario) =>
            usuario.id === updatedUser.id ? { ...usuario, ...updatedUser } : usuario
          )
        )
      }
    }

    window.addEventListener('sas-user-updated', handleUserUpdated as EventListener)
    
    return () => {
      window.removeEventListener('sas-user-updated', handleUserUpdated as EventListener)
    }
  }, [])

  // Calcular si se alcanzó el límite de usuarios
  // El servicio getAllUsuarios ya filtra los eliminados por defecto (deletedAt: null)
  // Por lo tanto, simplemente contamos todos los usuarios que están en el array
  const activeUsersCount = usuarios.filter(u => !u.deletedAt).length
  
  // Verificar si se alcanzó el límite
  // maxUsers puede ser null (sin límite o plan no asignado) o un número
  // Si maxUsers es null, no hay límite, así que siempre mostramos el botón
  const hasReachedLimit = maxUsers !== null && 
                          maxUsers !== undefined && 
                          typeof maxUsers === 'number' && 
                          maxUsers > 0 && 
                          activeUsersCount >= maxUsers

  // Verificar permisos para mostrar botones de acciones
  const canCreateUser = hasPermission('usuarios_crear')
  const canEditUser = hasPermission('usuarios_editar')
  const canDeleteUser = hasPermission('usuarios_eliminar')
  const canToggleUserStatus = hasPermission('usuarios_activar') || hasPermission('usuarios_desactivar')

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <UsuariosSasHeader
        title="Gestión de Usuarios"
        description="Administra todos los usuarios del sistema"
        newButtonText="Agregar Usuario"
        onNewClick={openCreateDialog}
        showNewButton={canCreateUser && !hasReachedLimit}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <UsuariosSasContainer 
        usuarios={usuarios}
        sucursalesCount={sucursales.length}
        onEdit={canEditUser ? openEditDialog : undefined}
        onToggleStatus={canToggleUserStatus ? handleToggleStatus : undefined}
        onDelete={canDeleteUser ? openDeleteDialog : undefined}
        onView={openViewDialog}
      />

      {/* Modal de crear/editar usuario */}
      <UsuarioSasFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        usuario={selectedUsuario}
        roles={roles}
        sucursales={sucursales}
        onSave={handleSave}
        defaultSucursalId={sucursales.length === 1 ? sucursales[0].id : undefined}
      />

      {/* Modal de confirmación de eliminar */}
      <UsuarioSasDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        usuario={selectedUsuario}
        onDelete={handleDelete}
      />

      {/* Modal de detalles del usuario */}
      <UsuarioSasDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialogs()
          }
        }}
        usuario={selectedUsuario ?? null}
      />

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onConfirm={confirmPerform}
        confirmColor={confirmColor}
      />
    </div>
  )
}

