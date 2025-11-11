"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { CashRegisterCloseDialog } from "./cash-register-close-dialog"
import { CashRegisterDeleteDialog } from "./cash-register-delete-dialog"
import { CashRegisterDetailsDialog } from "./cash-register-details-dialog"
import { CashRegisterFormDialog } from "./cash-register-form-dialog"
import { CashRegisterOpenDialog } from "./cash-register-open-dialog"
import { CashRegistersContainer } from "./cash-registers-container"
import { CashRegistersHeader } from "./cash-registers-header"

import type { CashRegisterWithRelations } from './types'

import { useCashRegisterActions } from "@/hooks/sales/cash-register/use-cash-register-actions"

interface CashRegistersPageClientProps {
  initialCashRegisters: CashRegisterWithRelations[]
  customerSlug: string
}

export function CashRegistersPageClient({ initialCashRegisters, customerSlug }: CashRegistersPageClientProps) {
  const [cashRegisters, setCashRegisters] = useState<CashRegisterWithRelations[]>(initialCashRegisters)
  const [isLoading, setIsLoading] = useState(false)
  const [detailCashRegister, setDetailCashRegister] = useState<CashRegisterWithRelations | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const uniqueBranchIds = useMemo(() => {
    const ids = new Set<string>()
    cashRegisters.forEach((register) => {
      if (register.branch?.id) {
        ids.add(register.branch.id)
      }
    })
    return ids
  }, [cashRegisters])

  const shouldShowBranchInfo = uniqueBranchIds.size !== 1
  const hasOpenCashRegister = cashRegisters.some((register) => register.isOpen)

  useEffect(() => {
    setCashRegisters(initialCashRegisters)
  }, [initialCashRegisters])

  useEffect(() => {
     if (!detailCashRegister) return
     const updated = cashRegisters.find((register) => register.id === detailCashRegister.id)
     if (updated) {
       setDetailCashRegister(updated)
    } else if (isDetailDialogOpen) {
      closeDetailsDialog()
    }
  }, [cashRegisters, detailCashRegister, isDetailDialogOpen])

  const loadCashRegisters = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/cajas?page=1&pageSize=1000`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudieron cargar las cajas")
      }

      const data = await response.json()
      setCashRegisters((data.cashRegisters || []) as CashRegisterWithRelations[])
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
    openDeleteDialog,
    openOpenDialog,
    openCloseDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleOpen,
    handleClose
  } = useCashRegisterActions(customerSlug, loadCashRegisters)

  const handleCreateClick = () => {
    if (hasOpenCashRegister) {
      toast.info("Cierra la caja abierta antes de crear una nueva.")
      return
    }
    openCreateDialog()
  }

  const openDetailsDialog = (cashRegister: CashRegisterWithRelations) => {
    setDetailCashRegister(cashRegister)
    setIsDetailDialogOpen(true)
  }

  const closeDetailsDialog = () => {
    setIsDetailDialogOpen(false)
    setDetailCashRegister(null)
  }

  const handleOpenDialog = (cashRegister: CashRegisterWithRelations) => {
    openOpenDialog(cashRegister)
  }

  const handleCloseDialog = (cashRegister: CashRegisterWithRelations) => {
    openCloseDialog(cashRegister)
  }

  const handleDeleteDialog = (cashRegister: CashRegisterWithRelations) => {
    openDeleteDialog(cashRegister)
  }

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <CashRegistersHeader
        title="Gestión de Cajas"
        description="Administra las cajas registradoras de tu sistema"
        newButtonText="Agregar Caja"
        onNewClick={handleCreateClick}
        newButtonDisabled={hasOpenCashRegister}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <CashRegistersContainer 
        cashRegisters={cashRegisters}
        isLoading={isLoading}
        onViewDetails={openDetailsDialog}
        onOpen={handleOpenDialog}
        onClose={handleCloseDialog}
        onDelete={handleDeleteDialog}
      />

      <CashRegisterDetailsDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog()
          } else {
            setIsDetailDialogOpen(true)
          }
        }}
        cashRegister={detailCashRegister}
        showBranchInfo={shouldShowBranchInfo}
      />

      {/* Modal de crear/editar caja */}
      <CashRegisterFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister as CashRegisterWithRelations | undefined}
        customerSlug={customerSlug}
        onSave={handleSave}
      />

      {/* Modal de abrir caja */}
      <CashRegisterOpenDialog
        open={isOpenDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister as CashRegisterWithRelations | undefined}
        onOpen={handleOpen}
      />

      {/* Modal de cerrar caja */}
      <CashRegisterCloseDialog
        open={isCloseDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister as CashRegisterWithRelations | undefined}
        onClose={handleClose}
      />

      {/* Modal de confirmación de eliminar */}
      <CashRegisterDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={selectedCashRegister as CashRegisterWithRelations | undefined}
        onDelete={handleDelete}
      />
    </div>
  )
}

