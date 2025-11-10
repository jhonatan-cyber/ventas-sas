"use client"

import { SalesCustomer } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { useApiError, extractErrorFromResponse } from "@/hooks/common/use-api-error"

export function useSalesCustomerActions(
  customerSlug: string, 
  onCustomersChange?: () => Promise<void> | void,
  setCustomers?: (customers: SalesCustomer[] | ((prev: SalesCustomer[]) => SalesCustomer[])) => void
) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { handleError } = useApiError()
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
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      const savedCustomer = await response.json()
      const message = selectedCustomer ? "Cliente actualizado" : "Cliente creado"
      toast.success(message)
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setCustomers) {
        if (selectedCustomer) {
          // Actualizar cliente existente
          setCustomers((prevCustomers) =>
            prevCustomers.map((customer) =>
              customer.id === selectedCustomer.id ? { ...customer, ...savedCustomer } : customer
            )
          )
        } else {
          // Agregar nuevo cliente
          setCustomers((prevCustomers) => [savedCustomer, ...prevCustomers])
        }
      } else if (onCustomersChange) {
        await Promise.resolve(onCustomersChange())
      }

      if (!setCustomers) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: selectedCustomer ? "Error al actualizar cliente" : "Error al crear cliente",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/${customerSlug}/clientes/${selectedCustomer.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      toast.success("Cliente eliminado")
      closeDialogs()

      // Actualizar estado local en tiempo real
      if (setCustomers) {
        setCustomers((prevCustomers) =>
          prevCustomers.filter((customer) => customer.id !== selectedCustomer.id)
        )
      } else if (onCustomersChange) {
        await Promise.resolve(onCustomersChange())
      }

      if (!setCustomers) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: "Error al eliminar cliente",
      })
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
        const errorMessage = await extractErrorFromResponse(response)
        throw new Error(errorMessage)
      }

      const updatedCustomer = await response.json()
      toast.success(newStatus ? "Cliente activado" : "Cliente desactivado")

      // Actualizar estado local en tiempo real
      if (setCustomers) {
        setCustomers((prevCustomers) =>
          prevCustomers.map((c) =>
            c.id === customer.id ? { ...c, ...updatedCustomer } : c
          )
        )
      } else if (onCustomersChange) {
        await Promise.resolve(onCustomersChange())
      }

      if (!setCustomers) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      handleError(error, {
        showToast: true,
        toastTitle: "Error al cambiar estado del cliente",
      })
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

