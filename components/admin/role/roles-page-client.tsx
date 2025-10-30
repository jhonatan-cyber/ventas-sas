"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { RoleHeader } from "@/components/admin/role/role-header"
import { RolesContainer } from "./roles-container"
import { RoleFormDialog } from "./role-form-dialog"
import { DeleteRoleDialog } from "./delete-role-dialog"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"
import { useRoleActions } from "@/hooks/admin/role/use-role-actions"

interface RolesPageClientProps {
  initialRoles: RoleWithStats[]
}

export function RolesPageClient({ initialRoles }: RolesPageClientProps) {
  const {
    openDialog,
    setOpenDialog,
    selectedRole,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
  } = useRoleActions()

  return (
    <AdminLayout>
      <div className="space-y-6 mt-6">
        {/* Header con título y botón */}
        <RoleHeader
          title="Gestión de Roles"
          description="Administra los roles y permisos del sistema"
          onNewClick={handleNewClick}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <RolesContainer
          roles={initialRoles}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />

        {/* Modal de crear/editar rol */}
        <RoleFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          role={selectedRole}
          onSave={handleSave}
        />

        {/* Modal de confirmación de eliminar */}
        <DeleteRoleDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          onConfirm={handleDeleteConfirm}
          roleName={deleteDialog.roleName}
        />
      </div>
    </AdminLayout>
  )
}

