"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CashRegister } from "@prisma/client"

export function useCashRegisterActions(customerSlug: string, onCashRegistersChange?: () => Promise<void> | void) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [selectedCashRegister, setSelectedCashRegister] = useState<CashRegister | undefined>()

  const openCreateDialog = () => {
    setSelectedCashRegister(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister)
    setIsDeleteDialogOpen(true)
  }

  const openOpenDialog = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister)
    setIsOpenDialogOpen(true)
  }

  const openCloseDialog = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister)
    setIsCloseDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setIsOpenDialogOpen(false)
    setIsCloseDialogOpen(false)
    setSelectedCashRegister(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedCashRegister
        ? `/api/${customerSlug}/cajas/${selectedCashRegister.id}`
        : `/api/${customerSlug}/cajas`

      const method = selectedCashRegister ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar la caja")
      }

      const message = selectedCashRegister ? "Caja actualizada" : "Caja creada"
      toast.success(message)
      closeDialogs()

      if (onCashRegistersChange) {
        await Promise.resolve(onCashRegistersChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la caja")
    }
  }

  const handleDelete = async () => {
    if (!selectedCashRegister) return

    try {
      const response = await fetch(`/api/${customerSlug}/cajas/${selectedCashRegister.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar la caja")
      }

      toast.success("Caja eliminada")
      closeDialogs()

      if (onCashRegistersChange) {
        await Promise.resolve(onCashRegistersChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la caja")
    }
  }

  const handleOpen = async (openingBalance: number) => {
    if (!selectedCashRegister) return

    try {
      const response = await fetch(`/api/${customerSlug}/cajas/${selectedCashRegister.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: 'open',
          openingBalance 
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al abrir la caja")
      }

      toast.success("Caja abierta correctamente")
      closeDialogs()

      if (onCashRegistersChange) {
        await Promise.resolve(onCashRegistersChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al abrir la caja")
    }
  }

  const handleClose = async () => {
    if (!selectedCashRegister) return

    try {
      const response = await fetch(`/api/${customerSlug}/cajas/${selectedCashRegister.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: 'close'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cerrar la caja")
      }

      toast.success("Caja cerrada correctamente")
      closeDialogs()

      if (onCashRegistersChange) {
        await Promise.resolve(onCashRegistersChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar la caja")
    }
  }

  return {
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
  }
}

