"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Branch } from "@prisma/client"

export function useBranchActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>()

  const openCreateDialog = () => {
    setSelectedBranch(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (branch: Branch) => {
    setSelectedBranch(branch)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedBranch(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedBranch
        ? `/api/${customerSlug}/sucursales/${selectedBranch.id}`
        : `/api/${customerSlug}/sucursales`

      const method = selectedBranch ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar la sucursal")
      }

      const message = selectedBranch ? "Sucursal actualizada" : "Sucursal creada"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la sucursal")
    }
  }

  const handleDelete = async () => {
    if (!selectedBranch) return

    try {
      const response = await fetch(`/api/${customerSlug}/sucursales/${selectedBranch.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar la sucursal")
      }

      toast.success("Sucursal eliminada")
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la sucursal")
    }
  }

  const handleToggleStatus = async (branch: Branch) => {
    try {
      const newStatus = !branch.isActive
      const response = await fetch(`/api/${customerSlug}/sucursales/${branch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado de la sucursal")
      }

      toast.success(newStatus ? "Sucursal activada" : "Sucursal desactivada")
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado de la sucursal")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedBranch,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

