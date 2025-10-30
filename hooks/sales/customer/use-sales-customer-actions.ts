"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SalesCustomer } from "@prisma/client"

export function useSalesCustomerActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<SalesCustomer | undefined>()

  const openCreateDialog = () => {
    setSelectedCustomer(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (customer: SalesCustomer) => {
    setSelectedCustomer(customer)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (customer: SalesCustomer) => {
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedCustomer(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedCustomer
        ? `/api/${customerSlug}/clientes/${selectedCustomer.id}`
        : `/api/${customerSlug}/clientes`

      const method = selectedCustomer ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el cliente")
      }

      const message = selectedCustomer ? "Cliente actualizado" : "Cliente creado"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el cliente")
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/${customerSlug}/clientes/${selectedCustomer.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el cliente")
      }

      toast.success("Cliente eliminado")
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el cliente")
    }
  }

  const handleToggleStatus = async (customer: SalesCustomer) => {
    try {
      const newStatus = !customer.isActive
      const response = await fetch(`/api/${customerSlug}/clientes/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado del cliente")
      }

      toast.success(newStatus ? "Cliente activado" : "Cliente desactivado")
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del cliente")
    }
  }

  return {
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
  }
}

