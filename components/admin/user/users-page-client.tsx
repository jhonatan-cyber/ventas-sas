"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { UserHeader } from "@/components/admin/user/user-header"
import { UsersContainer } from "./users-container"
import { UserFormDialog } from "./user-form-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"
import { useUserActions } from "@/hooks/admin/user/use-user-actions"

interface UsersPageClientProps {
  initialUsers: UserWithDetails[]
}

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const {
    openDialog,
    setOpenDialog,
    selectedUser,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
  } = useUserActions()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título y botón */}
        <UserHeader
          title="Gestión de Usuarios"
          description="Administra todos los usuarios del sistema"
          onNewClick={handleNewClick}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <UsersContainer 
          users={initialUsers} 
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />

        {/* Modal de crear/editar usuario */}
        <UserFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          user={selectedUser}
          onSave={handleSave}
        />

        {/* Modal de confirmación de eliminar */}
        <DeleteUserDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          onConfirm={handleDeleteConfirm}
          userName={deleteDialog.userName}
        />
      </div>
    </AdminLayout>
  )
}

