"use client"

import { BranchesHeader } from "./branches-header"
import { BranchesContainer } from "./branches-container"
import { BranchFormDialog } from "./branch-form-dialog"
import { BranchDeleteDialog } from "./branch-delete-dialog"
import { Branch } from "@prisma/client"
import { useBranchActions } from "@/hooks/sales/branch/use-branch-actions"

interface BranchesPageClientProps {
  initialBranches: Branch[]
  customerSlug: string
}

export function BranchesPageClient({ initialBranches, customerSlug }: BranchesPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedBranch,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useBranchActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <BranchesHeader
        title="Gestión de Sucursales"
        description="Administra las sucursales de tu organización"
        newButtonText="Nueva Sucursal"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <BranchesContainer 
        branches={initialBranches} 
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar sucursal */}
      <BranchFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        branch={selectedBranch}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <BranchDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        branch={selectedBranch}
        onDelete={handleDelete}
      />
    </div>
  )
}

