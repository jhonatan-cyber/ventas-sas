"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RoleSas } from "@prisma/client"

export function useRoleSasActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<(RoleSas & { customer?: any; sucursal?: any }) | undefined>()

  const openCreateDialog = () => {
    setSelectedRole(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (role: RoleSas & { customer?: any; sucursal?: any }) => {
    setSelectedRole(role)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (role: RoleSas & { customer?: any; sucursal?: any }) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedRole(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedRole
        ? `/api/${customerSlug}/roles/${selectedRole.id}`
        : `/api/${customerSlug}/roles`

      const method = selectedRole ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el rol")
      }

      const message = selectedRole ? "Rol actualizado" : "Rol creado"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el rol")
    }
  }

  const handleDelete = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/${customerSlug}/roles/${selectedRole.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el rol")
      }

      toast.success("Rol eliminado")
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el rol")
    }
  }

  const handleToggleStatus = async (role: RoleSas & { customer?: any; sucursal?: any }) => {
    try {
      const newStatus = !role.isActive
      const response = await fetch(`/api/${customerSlug}/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado del rol")
      }

      toast.success(newStatus ? "Rol activado" : "Rol desactivado")
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del rol")
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedRole,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

