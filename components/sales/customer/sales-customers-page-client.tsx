"use client"

import { useCallback, useEffect, useState } from "react"
import { SalesCustomersHeader } from "./sales-customers-header"
import { SalesCustomersContainer } from "./sales-customers-container"
import { SalesCustomerFormDialog } from "./sales-customer-form-dialog"
import { SalesCustomerDeleteDialog } from "./sales-customer-delete-dialog"
import { SalesCustomer } from "@prisma/client"
import { useSalesCustomerActions } from "@/hooks/sales/customer/use-sales-customer-actions"
import { toast } from "sonner"

interface SalesCustomersPageClientProps {
  initialCustomers: SalesCustomer[]
  customerSlug: string
}

export function SalesCustomersPageClient({ initialCustomers, customerSlug }: SalesCustomersPageClientProps) {
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
  } = useSalesCustomerActions(customerSlug, loadCustomers)

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y botón */}
      <SalesCustomersHeader
        title="Gestión de Clientes"
        description="Administra los clientes de tu sistema de ventas"
        newButtonText="Nuevo Cliente"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <SalesCustomersContainer 
        customers={customers} 
        isLoading={isLoading}
        onEdit={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onDelete={openDeleteDialog}
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

