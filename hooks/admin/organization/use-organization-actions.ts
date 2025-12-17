"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

export function useOrganizationActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDialog, setOpenDialog] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<any>(undefined)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, organizationId: '', organizationName: '' })

  const handleNewClick = () => {
    setSelectedOrganization(undefined)
    setOpenDialog(true)
  }

  const handleEdit = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/administracion/organizations/${organizationId}`)
      if (response.ok) {
        const organization = await response.json()
        setSelectedOrganization(organization)
        setIsEditDialogOpen(true)
      } else {
        throw new Error("Error al cargar la organización")
      }
    } catch (error: any) {
      toast.error("Error al cargar la organización", {
        description: error.message || "No se pudo cargar la organización",
        duration: 5000,
      })
    }
  }

  const handleDeleteClick = (organizationId: string, organizationName: string) => {
    setDeleteDialog({ open: true, organizationId, organizationName })
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedOrganization 
        ? `/api/administracion/organizations/${selectedOrganization.id}`
        : '/api/administracion/organizations'
      
      const method = selectedOrganization ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la organización')
      }

      const result = await response.json()
      const _updatedOrganization = result.organization || result
      
      if (selectedOrganization) {
        setIsEditDialogOpen(false)
      } else {
        setOpenDialog(false)
      }
      setSelectedOrganization(undefined)
      
      // Disparar evento para recargar organizaciones
      window.dispatchEvent(new Event("Organization-updated"))
      
      // Mostrar toast de éxito
      const orgName = data.razonSocial || data.name || 'Organización'
      if (selectedOrganization) {
        toast.success('Organización actualizada', {
          description: `${orgName} ha sido actualizada exitosamente.`,
          duration: 3000,
        })
      } else {
        toast.success('Organización creada', {
          description: `${orgName} ha sido creada exitosamente.`,
          duration: 3000,
        })
      }
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al guardar la organización:", error)
      const errorMessage = error.message || 'Ocurrió un error inesperado al guardar la organización.'
      toast.error('Error al guardar la organización', {
        description: errorMessage,
        duration: 5000,
      })
      throw error
    }
  }

  const handleToggleStatus = async (organizationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/administracion/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar el estado de la organización')
      }

      toast.success(isActive ? 'Organización activada' : 'Organización desactivada', {
        description: `La organización ha sido ${isActive ? 'activada' : 'desactivada'} exitosamente.`,
        duration: 3000,
      })

      // Disparar evento para recargar organizaciones
      window.dispatchEvent(new Event("Organization-updated"))

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al cambiar el estado de la organización:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo cambiar el estado de la organización.',
        duration: 5000,
      })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/administracion/organizations/${deleteDialog.organizationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la organización')
      }

      toast.success('Organización eliminada', {
        description: `${deleteDialog.organizationName || 'La organización'} ha sido eliminada exitosamente.`,
        duration: 3000,
      })

      setDeleteDialog({ open: false, organizationId: '', organizationName: '' })

      // Disparar evento para recargar organizaciones
      window.dispatchEvent(new Event("Organization-updated"))

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al eliminar la organización:", error)
      const errorMessage = error.message || 'No se pudo eliminar la organización. Intente nuevamente.'
      setDeleteDialog({ open: false, organizationId: '', organizationName: '' })
      toast.error('Error al eliminar la organización', {
        description: errorMessage,
        duration: 5000,
      })
      throw error
    }
  }

  return {
    openDialog,
    setOpenDialog,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedOrganization,
    setSelectedOrganization,
    deleteDialog,
    setDeleteDialog,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    isPending,
  }
}

