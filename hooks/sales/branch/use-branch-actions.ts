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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState<string>('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)
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
    setConfirmOpen(false)
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

  const handleToggleStatus = async (branch: any) => {
    const newStatus = !branch.isActive
    const count = branch?._count?.usuariosSas || 0
    
    // Si está desactivando y no tiene usuarios asignados, hacer la acción directamente sin confirmación
    if (newStatus === false && count === 0) {
      try {
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
      return
    }
    
    // Si está desactivando y tiene usuarios, mostrar confirmación
    if (newStatus === false) {
      setConfirmTitle('Desactivar sucursal')
      setConfirmColor('orange')
      setConfirmDesc(`Se desactivará la sucursal "${branch.name}" y se desactivarán ${count} usuario(s) asociados.`)
      setPendingAction(() => async () => {
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
        startTransition(() => router.refresh())
      })
      setConfirmOpen(true)
      return
    }
    
    // Si está activando, hacer la acción directamente
    try {
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
  
  const confirmPerform = async () => {
    if (!pendingAction) return
    try {
      await pendingAction()
    } catch (error: any) {
      toast.error(error.message || "Acción fallida")
    } finally {
      setConfirmOpen(false)
      setPendingAction(null)
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedBranch,
    confirmOpen,
    confirmTitle,
    confirmDesc,
    confirmColor,
    confirmPerform,
    setConfirmOpen,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

