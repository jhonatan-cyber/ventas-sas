"use client"

import { SalesCustomersHeader } from "./sales-customers-header"
import { SalesCustomersContainer } from "./sales-customers-container"
import { SalesCustomerFormDialog } from "./sales-customer-form-dialog"
import { SalesCustomerDeleteDialog } from "./sales-customer-delete-dialog"
import { SalesCustomer } from "@prisma/client"
import { useSalesCustomerActions } from "@/hooks/sales/customer/use-sales-customer-actions"

interface SalesCustomersPageClientProps {
  initialCustomers: SalesCustomer[]
  customerSlug: string
}

export function SalesCustomersPageClient({ initialCustomers, customerSlug }: SalesCustomersPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedCustomer,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useSalesCustomerActions(customerSlug)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <SalesCustomersHeader
        title="Gestión de Clientes"
        description="Administra los clientes de tu sistema de ventas"
        newButtonText="Nuevo Cliente"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <SalesCustomersContainer 
        customers={initialCustomers} 
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar cliente */}
      <SalesCustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        customer={selectedCustomer}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <SalesCustomerDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        customer={selectedCustomer}
        onDelete={handleDelete}
      />
    </div>
  )
}

