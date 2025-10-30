"use client"

import { UsuariosSasHeader } from "./usuarios-sas-header"
import { UsuariosSasContainer } from "./usuarios-sas-container"
import { UsuarioSasFormDialog } from "./usuario-sas-form-dialog"
import { UsuarioSasDeleteDialog } from "./usuario-sas-delete-dialog"
import { UsuarioSas, RoleSas, Branch } from "@prisma/client"
import { useUsuarioSasActions } from "@/hooks/sales/usuario/use-usuario-sas-actions"

interface UsuariosSasPageClientProps {
  initialUsuarios: (UsuarioSas & {
    rol: { id: string; nombre: string } | null
    sucursal: { id: string; name: string } | null
    customer: any
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
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedUsuario,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useUsuarioSasActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <UsuariosSasHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema SAS"
        newButtonText="Nuevo Usuario"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <UsuariosSasContainer 
        usuarios={initialUsuarios} 
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
      />

      {/* Modal de confirmación de eliminar */}
      <UsuarioSasDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        usuario={selectedUsuario}
        onDelete={handleDelete}
      />
    </div>
  )
}

