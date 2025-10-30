"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useSubscriptionActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<any>(undefined)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subscriptionId: '', customerName: '' })

  const handleNewClick = () => {
    setSelectedSubscription(undefined)
    setOpenDialog(true)
  }

  const handleEdit = (subscription: any) => {
    setSelectedSubscription(subscription)
    setOpenDialog(true)
  }

  const handleDeleteClick = (subscriptionId: string, customerName: string) => {
    setDeleteDialog({ open: true, subscriptionId, customerName })
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedSubscription 
        ? `/api/administracion/subscriptions/${selectedSubscription.id}`
        : '/api/administracion/subscriptions'
      
      const method = selectedSubscription ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la suscripción')
      }

      setOpenDialog(false)
      setSelectedSubscription(undefined)
      
      if (selectedSubscription) {
        toast.success('Suscripción actualizada', {
          description: `La suscripción ha sido actualizada exitosamente.`,
        })
      } else {
        toast.success('Suscripción creada', {
          description: `La suscripción ha sido creada exitosamente.`,
        })
      }
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al guardar la suscripción:", error)
      toast.error('Error al guardar la suscripción', {
        description: error.message || 'Ocurrió un error inesperado.',
      })
      throw error
    }
  }

  const handleToggleStatus = async (subscriptionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'cancelled' : 'active'
      
      const response = await fetch(`/api/administracion/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar el estado de la suscripción')
      }

      toast.success(newStatus === 'active' ? 'Suscripción activada' : 'Suscripción cancelada', {
        description: 'El estado de la suscripción ha sido actualizado exitosamente.',
      })

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al cambiar el estado de la suscripción:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo cambiar el estado de la suscripción.',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/administracion/subscriptions/${deleteDialog.subscriptionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la suscripción')
      }

      toast.success('Suscripción eliminada', {
        description: `${deleteDialog.organizationName} ha sido eliminada exitosamente.`,
      })

      setDeleteDialog({ open: false, subscriptionId: '', customerName: '' })

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al eliminar la suscripción:", error)
      setDeleteDialog({ open: false, subscriptionId: '', customerName: '' })
      toast.error('Error al eliminar la suscripción', {
        description: error.message || 'No se pudo eliminar la suscripción.',
      })
      throw error
    }
  }

  return {
    openDialog,
    setOpenDialog,
    selectedSubscription,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
    isPending,
  }
}

