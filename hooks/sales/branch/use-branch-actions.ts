"use client"

import { Branch } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type BranchWithRelations = Branch & {
  organization?: { id: string; razonSocial: string | null; name: string | null; slug: string | null } | null
  _count?: { usuariosSas: number }
}

export function useBranchActions(
  customerSlug: string,
  setBranches?: (branches: BranchWithRelations[] | ((prev: BranchWithRelations[]) => BranchWithRelations[])) => void,
  maxBranches?: number | null
) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState<string>('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<BranchWithRelations | undefined>()

  const openCreateDialog = () => {
    // La validación del límite de sucursales se hace en el servidor (API)
    setSelectedBranch(undefined)
    setIsFormDialogOpen(true)
  }

  const openViewDetailsDialog = (branch: BranchWithRelations) => {
    setSelectedBranch(branch)
    setIsDetailDialogOpen(true)
  }

  const openEditDialog = (branch: BranchWithRelations) => {
    setSelectedBranch(branch)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (branch: BranchWithRelations) => {
    setSelectedBranch(branch)
    setIsDeleteDialogOpen(true)
  }

  const _openDetailDialog = (branch: BranchWithRelations) => {
    setSelectedBranch(branch)
    setIsDetailDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setIsDetailDialogOpen(false)
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

      const savedBranch = await response.json()
      const message = selectedBranch ? "Sucursal actualizada" : "Sucursal creada"
      toast.success(message)
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setBranches) {
        if (selectedBranch) {
          // Actualizar sucursal existente
          setBranches((prevBranches) =>
            prevBranches.map((branch) =>
              branch.id === selectedBranch.id ? { ...branch, ...savedBranch } : branch
            )
          )
        } else {
          // Agregar nueva sucursal
          setBranches((prevBranches) => [savedBranch, ...prevBranches])
        }
      } else {
        // Fallback a router.refresh si no hay setBranches
        startTransition(() => {
          router.refresh()
        })
      }
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
      
      // Actualizar estado local en tiempo real
      if (setBranches) {
        setBranches((prevBranches) => prevBranches.filter((branch) => branch.id !== selectedBranch.id))
      } else {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la sucursal")
    }
  }

  const handleToggleStatus = async (branch: BranchWithRelations) => {
    const newStatus = !branch.isActive
    const count = branch?._count?.usuariosSas || 0
    
    // Función para actualizar el estado de la sucursal
    const updateBranchStatus = async () => {
      const response = await fetch(`/api/${customerSlug}/sucursales/${branch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar el estado de la sucursal")
      }

      const updatedBranch = await response.json()
      
      // Actualizar estado local en tiempo real
      if (setBranches) {
        setBranches((prevBranches) =>
          prevBranches.map((b) =>
            b.id === branch.id ? { ...b, isActive: newStatus, ...updatedBranch } : b
          )
        )
      }
      
      toast.success(newStatus ? "Sucursal activada" : "Sucursal desactivada")
    }
    
    // Si está desactivando y no tiene usuarios asignados, hacer la acción directamente sin confirmación
    if (newStatus === false && count === 0) {
      try {
        await updateBranchStatus()
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
      setPendingAction(() => updateBranchStatus)
      setConfirmOpen(true)
      return
    }
    
    // Si está activando, hacer la acción directamente
    try {
      await updateBranchStatus()
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
    isDetailDialogOpen,
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
    openViewDetailsDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

