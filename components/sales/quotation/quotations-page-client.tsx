"use client"

import { QuotationsHeader } from "./quotations-header"
import { QuotationsContainer } from "./quotations-container"
import { QuotationFormDialog } from "./quotation-form-dialog"
import { QuotationDeleteDialog } from "./quotation-delete-dialog"
import { Quotation } from "@prisma/client"
import { useQuotationActions } from "@/hooks/sales/quotation/use-quotation-actions"

interface QuotationsPageClientProps {
  initialQuotations: Quotation[]
  customerSlug: string
  organizationId: string
}

export function QuotationsPageClient({ initialQuotations, customerSlug, organizationId }: QuotationsPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedQuotation,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleStatusChange
  } = useQuotationActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <QuotationsHeader
        title="Gestión de Cotizaciones"
        description="Administra las cotizaciones a tus clientes"
        newButtonText="Nueva Cotización"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <QuotationsContainer 
        quotations={initialQuotations}
        organizationId={organizationId}
        onEdit={openEditDialog}
        onStatusChange={handleStatusChange}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar cotización */}
      <QuotationFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        quotation={selectedQuotation}
        organizationId={organizationId}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <QuotationDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        quotation={selectedQuotation}
        onDelete={handleDelete}
      />
    </div>
  )
}

