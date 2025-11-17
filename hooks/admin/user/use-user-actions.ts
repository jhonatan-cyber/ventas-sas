"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"

export function useUserActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDialog, setOpenDialog] = useState(false)
  const [detailDialog, setDetailDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(undefined)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: '', userName: '' })

  // Limpiar el usuario seleccionado cuando el diálogo se cierre
  useEffect(() => {
    if (!openDialog && selectedUser) {
      // Pequeño delay para permitir que la animación de cierre se complete
      const timer = setTimeout(() => {
        setSelectedUser(undefined)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [openDialog, selectedUser])

  const handleNewClick = () => {
    setSelectedUser(undefined)
    setOpenDialog(true)
  }

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setOpenDialog(true)
  }

  const handleView = (user: any) => {
    setSelectedUser(user)
    setDetailDialog(true)
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
        photo: data.photo || null,
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

      const updatedUser = await response.json()
      
      // Disparar evento para recargar usuarios
      window.dispatchEvent(new Event('user-updated'))
      
      // Si se actualizó el usuario logueado, recargar su información en el header
      if (selectedUser) {
        try {
          const currentUserResponse = await fetch('/api/administracion/me', {
            credentials: 'include'
          })
          if (currentUserResponse.ok) {
            const currentUser = await currentUserResponse.json()
            // Si el usuario actualizado es el usuario logueado, actualizar el header
            if (currentUser.id === updatedUser.id) {
              window.dispatchEvent(new Event('profile-updated'))
            }
          }
        } catch (error) {
          console.error('Error verificando usuario actual:', error)
        }
      }
      
      // Mostrar toast de éxito
      const userName = data.fullName || data.email || 'Usuario'
      if (selectedUser) {
        toast.success('Usuario actualizado', {
          description: `${userName} ha sido actualizado exitosamente.`,
          duration: 3000,
        })
      } else {
        toast.success('Usuario creado', {
          description: `${userName} ha sido creado exitosamente.`,
          duration: 3000,
        })
      }
      
      // El formulario cerrará el diálogo, el efecto limpiará el selectedUser
      // Refrescar la página después de un pequeño delay para permitir que el diálogo se cierre
      setTimeout(() => {
        startTransition(() => {
          router.refresh()
        })
      }, 300)
    } catch (error: any) {
      console.error("Error al guardar el usuario:", error)
      const errorMessage = error.message || 'Ocurrió un error inesperado al guardar el usuario.'
      toast.error('Error al guardar el usuario', {
        description: errorMessage,
        duration: 5000,
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
        description: `El usuario ha sido ${currentStatus ? 'desactivado' : 'activado'} exitosamente.`,
        duration: 3000,
      })

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al cambiar el estado del usuario:", error)
      toast.error('Error al cambiar estado', {
        description: error.message || 'No se pudo cambiar el estado del usuario.',
        duration: 5000,
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
        description: `${deleteDialog.userName || 'El usuario'} ha sido eliminado exitosamente.`,
        duration: 3000,
      })

      setDeleteDialog({ open: false, userId: '', userName: '' })

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error("Error al eliminar el usuario:", error)
      const errorMessage = error.message || 'No se pudo eliminar el usuario. Intente nuevamente.'
      setDeleteDialog({ open: false, userId: '', userName: '' })
      toast.error('Error al eliminar el usuario', {
        description: errorMessage,
        duration: 5000,
      })
      throw error
    }
  }

  return {
    openDialog,
    setOpenDialog,
    detailDialog,
    setDetailDialog,
    selectedUser,
    handleNewClick,
    handleEdit,
    handleView,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
    isPending,
  }
}

