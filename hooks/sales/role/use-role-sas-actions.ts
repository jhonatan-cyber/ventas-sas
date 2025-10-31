"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RoleSas } from "@prisma/client"

export function useRoleSasActions(customerSlug: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<(RoleSas & { customer?: any; sucursal?: any }) | undefined>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState<string>('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  const openCreateDialog = () => {
    setSelectedRole(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (role: RoleSas & { customer?: any; sucursal?: any }) => {
    setSelectedRole(role)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (role: RoleSas & { customer?: any; sucursal?: any }) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsFormDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedRole(undefined)
  }

  const handleSave = async (data: any) => {
    try {
      const url = selectedRole
        ? `/api/${customerSlug}/roles/${selectedRole.id}`
        : `/api/${customerSlug}/roles`

      const method = selectedRole ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el rol")
      }

      const message = selectedRole ? "Rol actualizado" : "Rol creado"
      toast.success(message)
      closeDialogs()
      
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el rol")
    }
  }

  const handleDelete = async () => {
    if (!selectedRole) return
    if ((selectedRole.nombre || '').toLowerCase() === 'administrador') {
      toast.error('No se puede eliminar el rol Administrador')
      return
    }
    const count = (selectedRole as any)?._count?.usuariosSas || 0
    setConfirmTitle('Eliminar rol')
    setConfirmColor('red')
    setConfirmDesc(`Se eliminará el rol "${selectedRole.nombre}" y se desactivarán ${count} usuario(s) asignados.`)
    setPendingAction(() => async () => {
      const response = await fetch(`/api/${customerSlug}/roles/${selectedRole.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json(); throw new Error(error.error || 'Error al eliminar el rol')
      }
      toast.success('Rol eliminado')
      closeDialogs(); startTransition(() => router.refresh())
    })
    setConfirmOpen(true)
  }

  const handleToggleStatus = async (role: RoleSas & { customer?: any; sucursal?: any }) => {
    const newStatus = !role.isActive
    const count = (role as any)?._count?.usuariosSas || 0
    
    // Si no tiene usuarios asignados, hacer la acción directamente sin confirmación
    if (count === 0) {
      try {
        const response = await fetch(`/api/${customerSlug}/roles/${role.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: newStatus }) })
        if (!response.ok) {
          const error = await response.json(); throw new Error(error.error || 'Error al cambiar el estado del rol')
        }
        toast.success(newStatus ? 'Rol activado' : 'Rol desactivado')
        startTransition(() => router.refresh())
      } catch (e: any) {
        toast.error(e?.message || 'Acción fallida')
      }
      return
    }
    
    // Si tiene usuarios, mostrar confirmación
    setConfirmTitle(newStatus ? 'Activar rol' : 'Desactivar rol')
    setConfirmColor(newStatus ? 'green' : 'orange')
    setConfirmDesc(`Se ${newStatus ? 'activará' : 'desactivará'} el rol "${role.nombre}" y afectará a ${count} usuario(s) asignados.`)
    setPendingAction(() => async () => {
      const response = await fetch(`/api/${customerSlug}/roles/${role.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: newStatus }) })
      if (!response.ok) {
        const error = await response.json(); throw new Error(error.error || 'Error al cambiar el estado del rol')
      }
      toast.success(newStatus ? 'Rol activado' : 'Rol desactivado')
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
    selectedRole,
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

