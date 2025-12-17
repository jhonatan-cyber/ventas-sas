"use client"

import { Branch } from "@prisma/client"
import { useState, useEffect } from "react"


import { BranchDeleteDialog } from "./branch-delete-dialog"
import { BranchDetailDialog } from "./branch-detail-dialog"
import { BranchFormDialog } from "./branch-form-dialog"
import { BranchesContainer } from "./branches-container"
import { BranchesHeader } from "./branches-header"

import ConfirmActionDialog from "@/components/sales/common/confirm-action-dialog"
import { useBranchActions } from "@/hooks/sales/branch/use-branch-actions"
import { useSasPermissions } from '@/hooks/sales/use-sas-permissions'
import { PERMISSIONS } from '@/lib/config/sas-permissions'

type BranchWithRelations = Branch & {
  organization?: { id: string; razonSocial: string | null; name: string | null; slug: string | null } | null
  _count?: { usuariosSas: number }
}

interface BranchesPageClientProps {
  initialBranches: BranchWithRelations[]
  customerSlug: string
  maxBranches?: number | null
}

export function BranchesPageClient({ initialBranches, customerSlug, maxBranches }: BranchesPageClientProps) {
const [branches, setBranches] = useState(initialBranches)
  
  const { hasPermission } = useSasPermissions()

  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailDialogOpen,
    selectedBranch,
    confirmOpen,
    confirmTitle,
    confirmDesc,
    confirmColor,
    confirmPerform,
    setConfirmOpen,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openViewDetailsDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useBranchActions(customerSlug, setBranches, maxBranches)

  // Actualizar branches cuando cambien los initialBranches (después de router.refresh)
  useEffect(() => {
    setBranches(initialBranches)
  }, [initialBranches])

  // Calcular si se alcanzó el límite de sucursales
  // El servicio getAllBranches ya filtra las eliminadas por defecto (deletedAt: null)
  // Por lo tanto, simplemente contamos todas las sucursales que están en el array
  const activeBranchesCount = branches.length
  
  // Verificar si se alcanzó el límite
  // maxBranches puede ser null (sin límite o plan no asignado) o un número
  // Si maxBranches es null, no hay límite, así que siempre mostramos el botón
  const hasReachedLimit = maxBranches !== null && 
                          maxBranches !== undefined && 
                          typeof maxBranches === 'number' && 
                          maxBranches > 0 && 
                          activeBranchesCount >= maxBranches

  const canCreate = hasPermission(PERMISSIONS.SUCURSALES_CREAR)
  const canEdit = hasPermission(PERMISSIONS.SUCURSALES_EDITAR)
  const canDelete = hasPermission(PERMISSIONS.SUCURSALES_ELIMINAR)
  const canView = hasPermission(PERMISSIONS.SUCURSALES_VER)

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <BranchesHeader
        title={"Sucursales"}
        description={"Gestiona las sucursales"}
        newButtonText={"Nueva Sucursal"}
        onNewClick={canCreate ? openCreateDialog : undefined}
        showNewButton={canCreate && !hasReachedLimit}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <BranchesContainer 
        branches={branches} 
        onEdit={canEdit ? openEditDialog : undefined}
        onToggleStatus={canEdit ? handleToggleStatus : undefined}
        onDelete={canDelete ? openDeleteDialog : undefined}
        onViewDetails={canView ? openViewDetailsDialog : undefined}
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

      {/* Modal de detalles de la sucursal */}
      <BranchDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={closeDialogs}
        branch={selectedBranch ?? null}
        customerSlug={customerSlug}
      />

      {/* Modal de confirmación para acciones */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        confirmText={"common.confirm"}
        confirmColor={confirmColor}
        onConfirm={confirmPerform}
      />
    </div>
  )
}

