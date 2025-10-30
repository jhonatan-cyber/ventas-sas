"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useUserActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(undefined)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: '', userName: '' })

  const handleNewClick = () => {
    setSelectedUser(undefined)
    setOpenDialog(true)
  }

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setOpenDialog(true)
  }

  const handleDeleteClick = (userId: string, userName: string) => {
    setDeleteDialog({ open: true, userId, userName })
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedUser 
        ? `/api/administracion/users/${selectedUser.id}`
        : '/api/administracion/users'
      
      const method = selectedUser ? 'PUT' : 'POST'

      // Preparar datos para enviar
      const userData: any = {
        email: data.email,
        ci: data.ci || null,
        fullName: data.fullName || null,
        address: data.address || null,
        phone: data.phone || null,
        role: data.role || 'user',
        roleId: data.roleId || null,
        isSuperAdmin: data.isSuperAdmin || false,
        isActive: data.isActive !== undefined ? data.isActive : true, // Crear como activo por defecto
      }

      // Solo incluir password si estamos creando un nuevo usuario o si se especificó uno
      // Para nuevos usuarios, el password es el CI (será hasheado en el servidor)
      if (!selectedUser && data.password) {
        userData.password = data.password
      } else if (selectedUser && data.password && data.password.trim() !== '') {
        userData.password = data.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el usuario')
      }

      setOpenDialog(false)
      setSelectedUser(undefined)
      
      // Mostrar toast de éxito
      if (selectedUser) {
        toast.success('Usuario actualizado', {
          description: `${data.fullName || data.email} ha sido actualizado exitosamente.`,
        })
      } else {
        toast.success('Usuario creado', {
          description: `${data.fullName || data.email} ha sido creado exitosamente.`,
        })
      }
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al guardar el usuario:", error)
      toast.error('Error al guardar el usuario', {
        description: error.message || 'Ocurrió un error inesperado.',
      })
      throw error
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/administracion/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar el estado del usuario')
      }

      toast.success(currentStatus ? 'Usuario desactivado' : 'Usuario activado', {
        description: 'El estado del usuario ha sido actualizado exitosamente.',
      })

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al cambiar el estado del usuario:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo activar/desactivar el usuario.',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/administracion/users/${deleteDialog.userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el usuario')
      }

      toast.success('Usuario eliminado', {
        description: `${deleteDialog.userName} ha sido eliminado exitosamente.`,
      })

      setDeleteDialog({ open: false, userId: '', userName: '' })

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al eliminar el usuario:", error)
      setDeleteDialog({ open: false, userId: '', userName: '' })
      toast.error('Error al eliminar el usuario', {
        description: error.message || 'No se pudo eliminar el usuario.',
      })
      throw error
    }
  }

  return {
    openDialog,
    setOpenDialog,
    selectedUser,
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

