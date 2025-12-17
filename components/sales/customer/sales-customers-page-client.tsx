"use client"

import { SalesCustomer } from "@prisma/client"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { SalesCustomerDeleteDialog } from "./sales-customer-delete-dialog"
import { SalesCustomerFormDialog } from "./sales-customer-form-dialog"
import { SalesCustomersContainer } from "./sales-customers-container"
import { SalesCustomersHeader } from "./sales-customers-header"

import { useSalesCustomerActions } from "@/hooks/sales/customer/use-sales-customer-actions"
import { useSasPermissions } from "@/hooks/sales/use-sas-permissions"


interface SalesCustomersPageClientProps {
  initialCustomers: SalesCustomer[]
  customerSlug: string
}

export function SalesCustomersPageClient({ initialCustomers, customerSlug }: SalesCustomersPageClientProps) {
// Hook para verificar permisos del usuario
  const { hasPermission } = useSasPermissions()
  
  const [customers, setCustomers] = useState<SalesCustomer[]>(initialCustomers)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/clientes?page=1&pageSize=1000`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudieron cargar los clientes")
      }

      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error: any) {
      console.error("Error al cargar clientes:", error)
      toast.error(error.message || "Error al cargar los clientes")
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug])

  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedCustomer,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleToggleStatus
  } = useSalesCustomerActions(customerSlug, loadCustomers, setCustomers)

  // Verificar permisos para mostrar botones de acciones
  const canCreateCustomer = hasPermission('clientes_crear')
  const canEditCustomer = hasPermission('clientes_editar')
  const canDeleteCustomer = hasPermission('clientes_eliminar')
  const canToggleCustomerStatus = hasPermission('clientes_activar') || hasPermission('clientes_desactivar')

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <SalesCustomersHeader
        title="Clientes"
        description="Gestiona los clientes del negocio"
        newButtonText="Nuevo Cliente"
        onNewClick={canCreateCustomer ? openCreateDialog : undefined}
        showNewButton={canCreateCustomer}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <SalesCustomersContainer 
        customers={customers} 
        isLoading={isLoading}
        onEdit={canEditCustomer ? openEditDialog : undefined}
        onToggleStatus={canToggleCustomerStatus ? handleToggleStatus : undefined}
        onDelete={canDeleteCustomer ? openDeleteDialog : undefined}
      />

      {/* Modal de crear/editar cliente */}
      <SalesCustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        customer={selectedCustomer}
        onSave={handleSave}
        isLoading={isLoading}
      />

      {/* Modal de confirmación de eliminar */}
      <SalesCustomerDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        customer={selectedCustomer}
        onDelete={handleDelete}
      />
    </div>
  )
}

