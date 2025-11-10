"use client"

import { UsuarioSas, RoleSas } from "@prisma/client"
import { useState, useEffect } from "react"

import { UsuarioSasDeleteDialog } from "./usuario-sas-delete-dialog"
import { UsuarioSasFormDialog } from "./usuario-sas-form-dialog"
import { UsuariosSasContainer } from "./usuarios-sas-container"
import { UsuariosSasHeader } from "./usuarios-sas-header"

import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog"
import { useUsuarioSasActions } from "@/hooks/sales/usuario/use-usuario-sas-actions"

interface UsuariosSasPageClientProps {
  initialUsuarios: (UsuarioSas & {
    rol: { id: string; nombre: string } | null
    sucursal: { id: string; name: string } | null
    customer?: any
  })[]
  roles: (RoleSas & { customer?: any; sucursal?: any })[]
  sucursales: { id: string; name: string }[]
  customerSlug: string
}

export function UsuariosSasPageClient({ 
  initialUsuarios, 
  roles, 
  sucursales, 
  customerSlug 
}: UsuariosSasPageClientProps) {
  const [usuarios, setUsuarios] = useState(initialUsuarios)
  
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
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

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <UsuariosSasHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema SAS"
        newButtonText="Agregar Usuario"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <UsuariosSasContainer 
        usuarios={usuarios}
        sucursalesCount={sucursales.length}
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
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

