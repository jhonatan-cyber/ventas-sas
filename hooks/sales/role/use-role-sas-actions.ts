"use client"

import { RoleSas } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type RoleWithRelations = RoleSas & {
  organization?: { razonSocial: string | null; name: string | null; slug: string | null } | null
  sucursal?: { name: string } | null
  _count?: { usuariosSas: number }
}

export function useRoleSasActions(
  customerSlug: string,
  setRoles?: (roles: RoleWithRelations[] | ((prev: RoleWithRelations[]) => RoleWithRelations[])) => void
) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleWithRelations | undefined>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmDesc, setConfirmDesc] = useState<string>('')
  const [confirmColor, setConfirmColor] = useState<'red'|'orange'|'green'>('orange')
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  // Función para recargar roles desde la API
  const _reloadRoles = async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/roles`)
      if (response.ok) {
        const data = await response.json()
        const rolesData = data.roles || data
        if (setRoles) {
          setRoles(rolesData)
        }
      }
    } catch (error) {
      console.error("Error recargando roles:", error)
    }
  }

  const openCreateDialog = () => {
    setSelectedRole(undefined)
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (role: RoleWithRelations) => {
    setSelectedRole(role)
    setIsFormDialogOpen(true)
  }

  const openDeleteDialog = (role: RoleWithRelations) => {
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

      const savedRole = await response.json()
      const message = selectedRole ? "Rol actualizado" : "Rol creado"
      toast.success(message)
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setRoles) {
        if (selectedRole) {
          // Actualizar rol existente manteniendo su posición
          setRoles((prevRoles) =>
            prevRoles.map((role) =>
              role.id === selectedRole.id ? { ...role, ...savedRole } : role
            )
          )
        } else {
          // Agregar nuevo rol al principio (ordenado por createdAt desc)
          setRoles((prevRoles) => [savedRole, ...prevRoles])
        }
      } else {
        // Fallback a router.refresh si no hay setRoles
        startTransition(() => {
          router.refresh()
        })
      }
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
    const count = selectedRole?._count?.usuariosSas || 0
    setConfirmTitle('Eliminar rol')
    setConfirmColor('red')
    setConfirmDesc(`Se eliminará el rol "${selectedRole.nombre}" y se desactivarán ${count} usuario(s) asignados.`)
    setPendingAction(() => async () => {
      const response = await fetch(`/api/${customerSlug}/roles/${selectedRole.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json(); throw new Error(error.error || 'Error al eliminar el rol')
      }
      toast.success('Rol eliminado')
      closeDialogs()
      
      // Actualizar estado local en tiempo real
      if (setRoles) {
        setRoles((prevRoles) => prevRoles.filter((role) => role.id !== selectedRole.id))
      } else {
        startTransition(() => router.refresh())
      }
    })
    setConfirmOpen(true)
  }

  const handleToggleStatus = async (role: RoleWithRelations) => {
    const newStatus = !role.isActive
    const count = role?._count?.usuariosSas || 0
    
    // Función para actualizar el estado del rol
    const updateRoleStatus = async () => {
      const response = await fetch(`/api/${customerSlug}/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cambiar el estado del rol')
      }
      const updatedRole = await response.json()
      
      // Actualizar estado local en tiempo real
      if (setRoles) {
        setRoles((prevRoles) =>
          prevRoles.map((r) =>
            r.id === role.id ? { ...r, isActive: newStatus, ...updatedRole } : r
          )
        )
      }
      
      toast.success(newStatus ? 'Rol activado' : 'Rol desactivado')
    }
    
    // Si no tiene usuarios asignados, hacer la acción directamente sin confirmación
    if (count === 0) {
      try {
        await updateRoleStatus()
      } catch (e: any) {
        toast.error(e?.message || 'Acción fallida')
      }
      return
    }
    
    // Si tiene usuarios, mostrar confirmación
    setConfirmTitle(newStatus ? 'Activar rol' : 'Desactivar rol')
    setConfirmColor(newStatus ? 'green' : 'orange')
    setConfirmDesc(`Se ${newStatus ? 'activará' : 'desactivará'} el rol "${role.nombre}" y afectará a ${count} usuario(s) asignados.`)
    setPendingAction(() => updateRoleStatus)
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

