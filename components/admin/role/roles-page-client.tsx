"use client";

;

import { DeleteRoleDialog } from "./delete-role-dialog";
import { RoleDetailDialog } from "./role-detail-dialog";
import { RoleFormDialog } from "./role-form-dialog";
import { RolePermissionsDialog } from "./role-permissions-dialog";
import { RolesContainer } from "./roles-container";
import { ToggleStatusDialog } from "./toggle-status-dialog";

import { RoleHeader } from "@/components/admin/role/role-header";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useRoleActions } from "@/hooks/admin/role/use-role-actions";
import { RoleWithStats } from "@/lib/services/admin/role-admin-service";

interface RolesPageClientProps {
  initialRoles: RoleWithStats[];
}

export function RolesPageClient({ initialRoles }: RolesPageClientProps) {const {
    openDialog,
    setOpenDialog,
    selectedRole,
    detailDialog,
    setDetailDialog,
    permissionsDialog,
    setPermissionsDialog,
    handleNewClick,
    handleEdit,
    handleView,
    handleManagePermissions,
    handleSavePermissions,
    handleSave,
    handleToggleStatus,
    handleToggleStatusConfirm,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
    toggleStatusDialog,
    setToggleStatusDialog,
  } = useRoleActions();

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header con título y botón */}
        <RoleHeader
          title={"Roles"}
          description={"Description"}
          newButtonText={"Create"}
          onNewClick={handleNewClick}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <RolesContainer
          roles={initialRoles}
          onEdit={handleEdit}
          onView={handleView}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
          onManagePermissions={handleManagePermissions}
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

        {/* Modal de confirmación de activar/desactivar */}
        <ToggleStatusDialog
          open={toggleStatusDialog.open}
          onOpenChange={(open) => setToggleStatusDialog({ ...toggleStatusDialog, open })}
          onConfirm={handleToggleStatusConfirm}
          roleName={toggleStatusDialog.roleName}
          currentStatus={toggleStatusDialog.currentStatus}
        />

        {/* Modal de detalles del rol */}
        <RoleDetailDialog
          open={detailDialog}
          onOpenChange={setDetailDialog}
          role={selectedRole ?? null}
        />

        {/* Modal de gestión de permisos */}
        <RolePermissionsDialog
          open={permissionsDialog}
          onOpenChange={setPermissionsDialog}
          role={selectedRole}
          onSave={handleSavePermissions}
        />
      </div>
    </AdminLayout>
  );
}
