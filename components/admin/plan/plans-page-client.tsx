"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { PlanHeader } from "@/components/admin/plan/plan-header"
import { PlansContainer } from "./plans-container"
import { PlanFormDialog } from "./plan-form-dialog"
import { DeletePlanDialog } from "./delete-plan-dialog"
import { SerializedSubscriptionPlanWithStats } from "./types"
import { usePlanActions } from "@/hooks/admin/plan/use-plan-actions"

interface PlansPageClientProps {
  initialPlans: SerializedSubscriptionPlanWithStats[]
}

export function PlansPageClient({ initialPlans }: PlansPageClientProps) {
  const {
    openDialog,
    setOpenDialog,
    selectedPlan,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
  } = usePlanActions()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header con título y botón */}
        <PlanHeader
          title="Gestión de Planes"
          description="Administra los planes de suscripción del sistema"
          onNewClick={handleNewClick}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <PlansContainer 
          plans={initialPlans} 
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />

        {/* Modal de crear/editar plan */}
        <PlanFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          plan={selectedPlan}
          onSave={handleSave}
        />

        {/* Modal de confirmación de eliminar */}
        <DeletePlanDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          onConfirm={handleDeleteConfirm}
          planName={deleteDialog.planName}
        />
      </div>
    </AdminLayout>
  )
}

