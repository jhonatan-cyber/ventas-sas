"use client"

import { ExpensesHeader } from "./expenses-header"
import { ExpensesContainer } from "./expenses-container"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseDeleteDialog } from "./expense-delete-dialog"
import { Expense } from "@prisma/client"
import { useExpenseActions } from "@/hooks/sales/expense/use-expense-actions"

interface ExpensesPageClientProps {
  initialExpenses: Array<Expense & { user?: any }>
  customerSlug: string
  organizationId: string
}

export function ExpensesPageClient({ initialExpenses, customerSlug, organizationId }: ExpensesPageClientProps) {
  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedExpense,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete
  } = useExpenseActions(customerSlug, organizationId)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <ExpensesHeader
        title="Gestión de Gastos"
        description="Administra los gastos de tu organización"
        newButtonText="Nuevo Gasto"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <ExpensesContainer 
        expenses={initialExpenses}
        organizationId={organizationId}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar gasto */}
      <ExpenseFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        expense={selectedExpense}
        organizationId={organizationId}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <ExpenseDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        expense={selectedExpense}
        onDelete={handleDelete}
      />
    </div>
  )
}

