"use client";

import { useState, useEffect } from "react";
import { RolesSasHeader } from "./roles-sas-header";
import { RolesSasContainer } from "./roles-sas-container";
import { RoleSasFormDialog } from "./role-sas-form-dialog";
import { RoleSasDeleteDialog } from "./role-sas-delete-dialog";
import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog";
import { RoleSas } from "@prisma/client";
import { useRoleSasActions } from "@/hooks/sales/role/use-role-sas-actions";

interface RolesSasPageClientProps {
  initialRoles: (RoleSas & {
    organization?: {
      razonSocial: string | null;
      name: string | null;
      slug: string | null;
    } | null;
    sucursal: { name: string } | null;
    _count?: { usuariosSas: number };
  })[];
  customerSlug: string;
}

export function RolesSasPageClient({
  initialRoles,
  customerSlug,
}: RolesSasPageClientProps) {
  const [roles, setRoles] = useState(initialRoles);
  
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
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <RolesSasHeader
        title="Gestión de Roles"
        description="Administra los roles del sistema"
        newButtonText="Agregar Rol"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <RolesSasContainer
        roles={roles}
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
