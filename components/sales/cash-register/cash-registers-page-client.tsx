"use client"

import { CashRegistersHeader } from "./cash-registers-header"
import { CashRegistersContainer } from "./cash-registers-container"
import { CashRegisterFormDialog } from "./cash-register-form-dialog"
import { CashRegisterDeleteDialog } from "./cash-register-delete-dialog"
import { CashRegisterOpenDialog } from "./cash-register-open-dialog"
import { CashRegisterCloseDialog } from "./cash-register-close-dialog"
import { CashRegister } from "@prisma/client"
import { useCashRegisterActions } from "@/hooks/sales/cash-register/use-cash-register-actions"

interface CashRegistersPageClientProps {
  initialCashRegisters: Array<CashRegister & { branch?: any }>
  customerSlug: string
  organizationId: string
}

export function CashRegistersPageClient({ initialCashRegisters, customerSlug, organizationId }: CashRegistersPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isOpenDialogOpen,
    isCloseDialogOpen,
    selectedCashRegister,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openOpenDialog,
    openCloseDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleOpen,
    handleClose
  } = useCashRegisterActions(customerSlug, organizationId)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <CashRegistersHeader
        title="Gestión de Cajas"
        description="Administra las cajas registradoras de tu organización"
        newButtonText="Nueva Caja"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <CashRegistersContainer 
        cashRegisters={initialCashRegisters}
        organizationId={organizationId}
        onEdit={openEditDialog}
        onOpen={openOpenDialog}
        onClose={openCloseDialog}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar caja */}
      <CashRegisterFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister}
        organizationId={organizationId}
        onSave={handleSave}
      />

      {/* Modal de abrir caja */}
      <CashRegisterOpenDialog
        open={isOpenDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister}
        onOpen={handleOpen}
      />

      {/* Modal de cerrar caja */}
      <CashRegisterCloseDialog
        open={isCloseDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister}
        onClose={handleClose}
      />

      {/* Modal de confirmación de eliminar */}
      <CashRegisterDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister}
        onDelete={handleDelete}
      />
    </div>
  )
}

