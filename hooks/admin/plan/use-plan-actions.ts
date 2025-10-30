"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SerializedSubscriptionPlanWithStats } from "@/components/admin/plan/types"

export function usePlanActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SerializedSubscriptionPlanWithStats | undefined>(undefined)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, planId: '', planName: '' })

  const handleNewClick = () => {
    setSelectedPlan(undefined)
    setOpenDialog(true)
  }

  const handleEdit = (plan: SerializedSubscriptionPlanWithStats) => {
    setSelectedPlan(plan)
    setOpenDialog(true)
  }

  const handleDeleteClick = (planId: string, planName: string) => {
    setDeleteDialog({ open: true, planId, planName })
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedPlan 
        ? `/api/administracion/plans/${selectedPlan.id}`
        : '/api/administracion/plans'
      
      const method = selectedPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el plan')
      }

      setOpenDialog(false)
      setSelectedPlan(undefined)
      
      // Mostrar toast de éxito
      if (selectedPlan) {
        toast.success('Plan actualizado', {
          description: `${data.name} ha sido actualizado exitosamente.`,
        })
      } else {
        toast.success('Plan creado', {
          description: `${data.name} ha sido creado exitosamente.`,
        })
      }
      
      // Refrescar la página para mostrar los cambios
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al guardar el plan:", error)
      toast.error('Error al guardar el plan', {
        description: error.message || 'Ocurrió un error inesperado.',
      })
      throw error
    }
  }

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/administracion/plans/${planId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar el estado del plan')
      }

      // Mostrar toast de éxito
      if (!currentStatus) {
        toast.success('Plan activado', {
          description: 'El plan ha sido activado exitosamente.',
        })
      } else {
        toast.success('Plan desactivado', {
          description: 'El plan ha sido desactivado exitosamente.',
        })
      }

      // Refrescar la página para mostrar los cambios
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al cambiar el estado del plan:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo activar/desactivar el plan.',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/administracion/plans/${deleteDialog.planId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el plan')
      }

      // Mostrar toast de éxito
      toast.success('Plan eliminado', {
        description: `${deleteDialog.planName} ha sido eliminado exitosamente.`,
      })

      setDeleteDialog({ open: false, planId: '', planName: '' })

      // Refrescar la página para mostrar los cambios
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al eliminar el plan:", error)
      setDeleteDialog({ open: false, planId: '', planName: '' })
      toast.error('Error al eliminar el plan', {
        description: error.message || 'No se pudo eliminar el plan.',
      })
      throw error
    }
  }

  return {
    openDialog,
    setOpenDialog,
    selectedPlan,
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

