"use client"

import { useTranslations } from "next-intl"

import { useState, useEffect } from "react"

import { DeleteUserDialog } from "./delete-user-dialog"
import { UserDetailDialog } from "./user-detail-dialog"
import { UserFormDialog } from "./user-form-dialog"
import { UsersContainer } from "./users-container"

import { UserHeader } from "@/components/admin/user/user-header"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useUserActions } from "@/hooks/admin/user/use-user-actions"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"

interface UsersPageClientProps {
  initialUsers: UserWithDetails[]
}

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const t = useTranslations()
  const [users, setUsers] = useState<UserWithDetails[]>(initialUsers)
  const {
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
  } = useUserActions()

  // Recargar usuarios después de guardar
  useEffect(() => {
    const reloadUsers = async () => {
      try {
        const response = await fetch('/api/administracion/users')
        if (response.ok) {
          const updatedUsers = await response.json()
          setUsers(updatedUsers)
        }
      } catch (error) {
        console.error('Error recargando usuarios:', error)
      }
    }

    // Escuchar eventos de recarga
    const handleReload = () => reloadUsers()
    window.addEventListener('user-updated', handleReload)
    
    return () => {
      window.removeEventListener('user-updated', handleReload)
    }
  }, [])

  // Actualizar usuarios cuando cambien los initialUsers (después de router.refresh)
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header con título y botón */}
        <UserHeader
          title={t('users.title')}
          description={t('users.description')}
          newButtonText={t('users.create')}
          onNewClick={handleNewClick}
        />

        {/* Contenedor con filtros, tabla y paginación */}
        <UsersContainer 
          users={users} 
          onEdit={handleEdit}
          onView={handleView}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />

        {/* Modal de crear/editar usuario */}
        <UserFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          user={selectedUser}
          onSave={handleSave}
        />

        {/* Modal de detalles del usuario */}
        <UserDetailDialog
          open={detailDialog}
          onOpenChange={setDetailDialog}
          user={selectedUser}
        />

        {/* Modal de confirmación de eliminar */}
        <DeleteUserDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          onConfirm={handleDeleteConfirm}
          userName={deleteDialog.userName}
        />
      </div>
    </AdminLayout>
  )
}

