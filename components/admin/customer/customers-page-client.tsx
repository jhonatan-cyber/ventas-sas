"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { CustomersHeader } from "./customers-header";
import { CustomersContainer } from "./customers-container";
import { CustomerFormDialog } from "./customer-form-dialog";
import { CustomerDetailDialog } from "./customer-detail-dialog";
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import { Customer } from "@/lib/types";
import { useCustomerActions } from "@/hooks/admin/customer/use-customer-actions";

interface CustomersPageClientProps {
  initialCustomers: Customer[];
}

export function CustomersPageClient({
  initialCustomers,
}: CustomersPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    selectedCustomer,
    customerDetails,
    isLoadingDetails,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openDetailDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus,
  } = useCustomerActions();

  return (
    <AdminLayout>
        <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header con título y botón */}
        <CustomersHeader
          title="Gestión de Clientes"
          description="Administra todos los clientes de tu organización"
          newButtonText="Agregar Cliente"
          onNewClick={openCreateDialog}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <CustomersContainer
          customers={initialCustomers}
          onEdit={openEditDialog}
          onViewDetails={openDetailDialog}
          onToggleStatus={handleToggleStatus}
          onDelete={openDeleteDialog}
        />

        {/* Modal de crear/editar cliente */}
        <CustomerFormDialog
          open={isFormDialogOpen}
          onOpenChange={closeDialogs}
          customer={selectedCustomer}
          onSave={handleSave}
        />

        {/* Modal de detalles del cliente */}
        <CustomerDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          customer={customerDetails}
        />

        {/* Modal de confirmación de eliminar */}
        <CustomerDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={closeDialogs}
          customer={selectedCustomer}
          onDelete={handleDelete}
        />
      </div>
    </AdminLayout>
  );
}
