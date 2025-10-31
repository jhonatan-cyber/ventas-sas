"use client"

import { useCallback, useEffect, useState } from "react"
import { CashRegistersHeader } from "./cash-registers-header"
import { CashRegistersContainer } from "./cash-registers-container"
import { CashRegisterFormDialog } from "./cash-register-form-dialog"
import { CashRegisterDeleteDialog } from "./cash-register-delete-dialog"
import { CashRegisterOpenDialog } from "./cash-register-open-dialog"
import { CashRegisterCloseDialog } from "./cash-register-close-dialog"
import { CashRegister } from "@prisma/client"
import { useCashRegisterActions } from "@/hooks/sales/cash-register/use-cash-register-actions"
import { toast } from "sonner"

interface CashRegistersPageClientProps {
  initialCashRegisters: Array<CashRegister & { branch?: any }>
  customerSlug: string
}

export function CashRegistersPageClient({ initialCashRegisters, customerSlug }: CashRegistersPageClientProps) {
  const [cashRegisters, setCashRegisters] = useState(initialCashRegisters)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCashRegisters(initialCashRegisters)
  }, [initialCashRegisters])

  const loadCashRegisters = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/cajas?page=1&pageSize=1000`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudieron cargar las cajas")
      }

      const data = await response.json()
      setCashRegisters(data.cashRegisters || [])
    } catch (error: any) {
      console.error("Error al cargar cajas:", error)
      toast.error(error.message || "Error al cargar las cajas")
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug])

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
  } = useCashRegisterActions(customerSlug, loadCashRegisters)

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
        cashRegisters={cashRegisters}
        isLoading={isLoading}
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
        customerSlug={customerSlug}
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

