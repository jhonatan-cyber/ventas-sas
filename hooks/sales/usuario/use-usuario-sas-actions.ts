"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UsuarioSas } from "@prisma/client"

export function useUsuarioSasActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<(UsuarioSas & { rol?: any; sucursal?: any }) | undefined>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  const openCreateDialog = () => {
    setSelectedUsuario(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => {
    setSelectedUsuario(usuario)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => {
    setSelectedUsuario(usuario)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
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

      const message = selectedUsuario ? "Usuario actualizado" : "Usuario creado"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
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
      closeDialogs(); startTransition(() => router.refresh())
    })
    setConfirmOpen(true)
  }

  const handleToggleStatus = async (usuario: UsuarioSas & { rol?: any; sucursal?: any }) => {
    const newStatus = !usuario.isActive
    setConfirmTitle(newStatus ? 'Activar usuario' : 'Desactivar usuario')
    setConfirmColor(newStatus ? 'green' : 'orange')
    setConfirmDesc(`Se ${newStatus ? 'activará' : 'desactivará'} al usuario "${usuario.nombre} ${usuario.apellido}" (${usuario.ci || 'sin CI'}).`)
    setPendingAction(() => async () => {
      const response = await fetch(`/api/${customerSlug}/usuarios/${usuario.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: newStatus }) })
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Error al cambiar el estado del usuario') }
      toast.success(newStatus ? 'Usuario activado' : 'Usuario desactivado')
      startTransition(() => router.refresh())
    })
    setConfirmOpen(true)
  }

  const confirmPerform = async () => {
    if (!pendingAction) return
    try { await pendingAction() } catch (e: any) { toast.error(e?.message || 'Acción fallida') } finally { setConfirmOpen(false); setPendingAction(null) }
  }

  return {
    isFormDialogOpen,
    isDeleteDialogOpen,
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
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  }
}

