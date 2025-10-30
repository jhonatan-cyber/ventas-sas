"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Customer } from "@/lib/types"

export function useCustomerActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()

  const openCreateDialog = () => {
    setSelectedCustomer(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (customer: Customer) => {
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
        ? `/api/administracion/customers/${selectedCustomer.id}`
        : "/api/administracion/customers"

      const method = selectedCustomer ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Error al guardar el cliente")
      }

      const message = selectedCustomer ? "Cliente actualizado" : "Cliente creado"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error("Error al guardar el cliente")
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/administracion/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente")
      }

      toast.success("Cliente eliminado")
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error("Error al eliminar el cliente")
    }
  }

  const handleToggleStatus = async (customer: Customer) => {
    try {
      const newStatus = !customer.isActive
      const response = await fetch(`/api/administracion/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del cliente")
      }

      toast.success(newStatus ? "Cliente activado" : "Cliente desactivado")
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error("Error al cambiar el estado del cliente")
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

