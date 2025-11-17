"use client";

import { useTranslations } from "next-intl";

import { RoleSas } from "@prisma/client";
import { useState, useEffect } from "react";

import { RoleSasDeleteDialog } from "./role-sas-delete-dialog";
import { RoleSasDetailDialog } from "./role-sas-detail-dialog";
import { RoleSasFormDialog } from "./role-sas-form-dialog";
import { RoleSasPermissionsDialog } from "./role-sas-permissions-dialog";
import { RolesSasContainer } from "./roles-sas-container";
import { RolesSasHeader } from "./roles-sas-header";

import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog";
import { useRoleSasActions } from "@/hooks/sales/role/use-role-sas-actions";

interface RolesSasPageClientProps {
  initialRoles: (RoleSas & {
    organization?: {
      razonSocial: string | null;
      name: string | null;
      slug: string | null;
    } | null;
    sucursal?: { name: string } | null;
    _count?: { usuariosSas: number };
  })[];
  customerSlug: string;
}

export function RolesSasPageClient({
  initialRoles,
  customerSlug,
}: RolesSasPageClientProps) {
  const t = useTranslations()
  const [roles, setRoles] = useState(initialRoles);
  
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailDialogOpen,
    isPermissionsDialogOpen,
    selectedRole,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openViewDialog,
    openManagePermissionsDialog,
    closeDialogs,
    handleSave,
    handleSavePermissions,
    handleDelete,
    handleToggleStatus,
    confirmOpen,
    confirmTitle,
    confirmDesc,
    confirmColor,
    confirmPerform,
    setConfirmOpen,
  } = useRoleSasActions(customerSlug, setRoles);

  // Actualizar roles cuando cambien los initialRoles (después de router.refresh)
  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <RolesSasHeader
        title={t('roles.title')}
        description={t('roles.description')}
        newButtonText={t('roles.create')}
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <RolesSasContainer
        roles={roles}
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
        onView={openViewDialog}
        onManagePermissions={openManagePermissionsDialog}
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

      {/* Modal de detalles del rol */}
      <RoleSasDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialogs()
          }
        }}
        role={selectedRole}
      />

      {/* Modal de gestión de permisos */}
      <RoleSasPermissionsDialog
        open={isPermissionsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialogs()
          }
        }}
        role={selectedRole}
        customerSlug={customerSlug}
        onSave={handleSavePermissions}
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
  );
}
