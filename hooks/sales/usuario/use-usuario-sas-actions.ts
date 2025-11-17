"use client"

import { UsuarioSas } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type UsuarioWithRelations = UsuarioSas & {
  rol?: { id: string; nombre: string } | null
  sucursal?: { id: string; name: string } | null
  customer?: any
}

export function useUsuarioSasActions(
  customerSlug: string,
  setUsuarios?: (usuarios: UsuarioWithRelations[] | ((prev: UsuarioWithRelations[]) => UsuarioWithRelations[])) => void
) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioWithRelations | undefined>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  const openCreateDialog = () => {
    setSelectedUsuario(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (usuario: UsuarioWithRelations) => {
    setSelectedUsuario(usuario)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (usuario: UsuarioWithRelations) => {
    setSelectedUsuario(usuario)
    setIsDeleteDialogOpen(true)
  }

  const openViewDialog = (usuario: UsuarioWithRelations) => {
    setSelectedUsuario(usuario)
    setIsDetailDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setIsDetailDialogOpen(false)
    setSelectedUsuario(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedUsuario
        ? `/api/${customerSlug}/usuarios/${selectedUsuario.id}`
        : `/api/${customerSlug}/usuarios`

      const method = selectedUsuario ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el usuario")
      }

      const savedUsuario = await response.json()
      const message = selectedUsuario ? "Usuario actualizado" : "Usuario creado"
      toast.success(message)
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setUsuarios) {
        if (selectedUsuario) {
          // Actualizar usuario existente
          setUsuarios((prevUsuarios) =>
            prevUsuarios.map((usuario) =>
              usuario.id === selectedUsuario.id ? { ...usuario, ...savedUsuario } : usuario
            )
          )
        } else {
          // Agregar nuevo usuario
          setUsuarios((prevUsuarios) => [savedUsuario, ...prevUsuarios])
        }
      } else {
        // Fallback a router.refresh si no hay setUsuarios
        startTransition(() => {
          router.refresh()
        })
      }

      // Disparar evento personalizado para actualizar el header si es el usuario logueado
      if (savedUsuario) {
        const event = new CustomEvent('sas-user-updated', { detail: savedUsuario })
        window.dispatchEvent(event)
        // También usar localStorage para sincronizar entre pestañas
        try {
          localStorage.setItem('sas-user-updated', JSON.stringify({ userId: savedUsuario.id, timestamp: Date.now() }))
          localStorage.removeItem('sas-user-updated') // Remover inmediatamente para que el evento se dispare
        } catch {}
      }
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el usuario")
    }
  }

  const handleDelete = async () => {
    if (!selectedUsuario) return
    setConfirmTitle('Eliminar usuario')
    setConfirmColor('red')
    setConfirmDesc(`Se eliminará al usuario "${selectedUsuario.nombre} ${selectedUsuario.apellido}" y se revocarán sus accesos.`)
    setPendingAction(() => async () => {
      const response = await fetch(`/api/${customerSlug}/usuarios/${selectedUsuario.id}`, { method: 'DELETE' })
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Error al eliminar el usuario') }
      toast.success('Usuario eliminado')
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setUsuarios) {
        setUsuarios((prevUsuarios) => prevUsuarios.filter((usuario) => usuario.id !== selectedUsuario.id))
      } else {
        startTransition(() => router.refresh())
      }
    })
    setConfirmOpen(true)
  }

  const handleToggleStatus = async (usuario: UsuarioWithRelations) => {
    const newStatus = !usuario.isActive
    
    // Función para actualizar el estado del usuario
    const updateUsuarioStatus = async () => {
      const response = await fetch(`/api/${customerSlug}/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cambiar el estado del usuario')
      }
      const updatedUsuario = await response.json()
      
      // Actualizar estado local en tiempo real
      if (setUsuarios) {
        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((u) =>
            u.id === usuario.id ? { ...u, isActive: newStatus, ...updatedUsuario } : u
          )
        )
      }
      
      toast.success(newStatus ? 'Usuario activado' : 'Usuario desactivado')
    }
    
    setConfirmTitle(newStatus ? 'Activar usuario' : 'Desactivar usuario')
    setConfirmColor(newStatus ? 'green' : 'orange')
    setConfirmDesc(`Se ${newStatus ? 'activará' : 'desactivará'} al usuario "${usuario.nombre} ${usuario.apellido}" (${usuario.ci || 'sin CI'}).`)
    setPendingAction(() => updateUsuarioStatus)
    setConfirmOpen(true)
  }

  const confirmPerform = async () => {
    if (!pendingAction) return
    try {
      await pendingAction()
    } catch (e: any) {
      toast.error(e?.message || 'Acción fallida')
    } finally {
      setConfirmOpen(false)
      setPendingAction(null)
    }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isDetailDialogOpen,
    selectedUsuario,
    confirmOpen,
    confirmTitle,
    confirmDesc,
    confirmColor,
    confirmPerform,
    setConfirmOpen,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openViewDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

