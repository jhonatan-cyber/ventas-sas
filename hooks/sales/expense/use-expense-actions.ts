"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SalesExpenseWithRelations } from "@/components/sales/expense/types"

export function useExpenseActions(customerSlug: string, onExpensesChange?: () => Promise<void> | void) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<SalesExpenseWithRelations | undefined>()

  const openCreateDialog = () => {
    setSelectedExpense(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (expense: SalesExpenseWithRelations) => {
    setSelectedExpense(expense)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (expense: SalesExpenseWithRelations) => {
    setSelectedExpense(expense)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedExpense(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedExpense
        ? `/api/${customerSlug}/gastos/${selectedExpense.id}`
        : `/api/${customerSlug}/gastos`

      const method = selectedExpense ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el gasto")
      }

      const message = selectedExpense ? "Gasto actualizado" : "Gasto creado"
      toast.success(message)
      closeDialogs()

      if (onExpensesChange) {
        await Promise.resolve(onExpensesChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el gasto")
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return

    try {
      const response = await fetch(`/api/${customerSlug}/gastos/${selectedExpense.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el gasto")
      }

      toast.success("Gasto eliminado")
      closeDialogs()

      if (onExpensesChange) {
        await Promise.resolve(onExpensesChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el gasto")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedExpense,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete
  }
}

