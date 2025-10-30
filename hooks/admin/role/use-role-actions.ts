"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

export function useRoleActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleWithStats | undefined>(undefined)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, roleId: '', roleName: '' })

  const handleNewClick = () => {
    setSelectedRole(undefined)
    setOpenDialog(true)
  }

  const handleEdit = (role: RoleWithStats) => {
    setSelectedRole(role)
    setOpenDialog(true)
  }

  const handleDeleteClick = (roleId: string, roleName: string) => {
    setDeleteDialog({ open: true, roleId, roleName })
  }

  const handleSave = async (data: { name: string; description: string }) => {
    try {
      const url = selectedRole 
        ? `/api/administracion/roles/${selectedRole.id}`
        : '/api/administracion/roles'
      
      const method = selectedRole ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el rol')
      }

      setOpenDialog(false)
      setSelectedRole(undefined)
      
      // Mostrar toast de éxito
      if (selectedRole) {
        toast.success('Rol actualizado', {
          description: `${data.name} ha sido actualizado exitosamente.`,
        })
      } else {
        toast.success('Rol creado', {
          description: `${data.name} ha sido creado exitosamente.`,
        })
      }
      
      // Refrescar la página para mostrar los cambios
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al guardar el rol:", error)
      toast.error('Error al guardar el rol', {
        description: error.message || 'Ocurrió un error inesperado.',
      })
      throw error
    }
  }

  const handleToggleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      console.log('handleToggleStatus called with:', { roleId, currentStatus, isActive: !currentStatus })
      const response = await fetch(`/api/administracion/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar el estado del rol')
      }

      // Mostrar toast de éxito
      if (!currentStatus) {
        toast.success('Rol activado', {
          description: 'El rol ha sido activado exitosamente.',
        })
      } else {
        toast.success('Rol desactivado', {
          description: 'El rol ha sido desactivado exitosamente.',
        })
      }

      // Refrescar la página para mostrar los cambios
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al cambiar el estado del rol:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo activar/desactivar el rol.',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/administracion/roles/${deleteDialog.roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el rol')
      }

      // Mostrar toast de éxito
      toast.success('Rol eliminado', {
        description: `${deleteDialog.roleName} ha sido eliminado exitosamente.`,
      })

      setDeleteDialog({ open: false, roleId: '', roleName: '' })

      // Refrescar la página para mostrar los cambios
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al eliminar el rol:", error)
      setDeleteDialog({ open: false, roleId: '', roleName: '' })
      toast.error('Error al eliminar el rol', {
        description: error.message || 'No se pudo eliminar el rol.',
      })
      throw error
    }
  }

  return {
    openDialog,
    setOpenDialog,
    selectedRole,
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

