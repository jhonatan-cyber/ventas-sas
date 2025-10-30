"use client"

import { RolesSasHeader } from "./roles-sas-header"
import { RolesSasContainer } from "./roles-sas-container"
import { RoleSasFormDialog } from "./role-sas-form-dialog"
import { RoleSasDeleteDialog } from "./role-sas-delete-dialog"
import { RoleSas } from "@prisma/client"
import { useRoleSasActions } from "@/hooks/sales/role/use-role-sas-actions"

interface RolesSasPageClientProps {
  initialRoles: (RoleSas & {
    customer: { razonSocial: string | null; nombre: string | null; apellido: string | null } | null
    sucursal: { name: string } | null
  })[]
  customerSlug: string
}

export function RolesSasPageClient({ initialRoles, customerSlug }: RolesSasPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedRole,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useRoleSasActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <RolesSasHeader
        title="Gestión de Roles"
        description="Administra los roles del sistema SAS"
        newButtonText="Nuevo Rol"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <RolesSasContainer 
        roles={initialRoles} 
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar rol */}
      <RoleSasFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        role={selectedRole}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <RoleSasDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        role={selectedRole}
        onDelete={handleDelete}
      />
    </div>
  )
}

