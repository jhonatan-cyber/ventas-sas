"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { SalesExpenseWithRelations } from "@/components/sales/expense/types"
import { useApiError, extractErrorFromResponse } from "@/hooks/common/use-api-error"

export function useExpenseActions(customerSlug: string, onExpensesChange?: () => Promise<void> | void) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const { handleError } = useApiError()
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
        credentials: "include",
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorPayload: unknown = null
        try {
          const clone = response.clone()
          errorPayload = await clone.json()
        } catch {
          errorPayload = null
        }
        const errorMessage = await extractErrorFromResponse(response)
        console.error(
          `Error al guardar gasto - status: ${response.status}, statusText: ${response.statusText}, message: ${errorMessage}`,
          errorPayload
        )
        if (errorPayload && typeof errorPayload === "object" && "details" in errorPayload) {
        }
        throw new Error(errorMessage)
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
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: selectedExpense ? "Error al actualizar gasto" : "Error al crear gasto",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return

    try {
      const response = await fetch(`/api/${customerSlug}/gastos/${selectedExpense.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      toast.success("Gasto eliminado")
      closeDialogs()

      if (onExpensesChange) {
        await Promise.resolve(onExpensesChange())
      }

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: "Error al eliminar gasto",
      })
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

