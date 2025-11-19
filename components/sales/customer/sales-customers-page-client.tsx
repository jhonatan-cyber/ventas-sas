"use client"

import { SalesCustomer } from "@prisma/client"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { SalesCustomerDeleteDialog } from "./sales-customer-delete-dialog"
import { SalesCustomerFormDialog } from "./sales-customer-form-dialog"
import { SalesCustomersContainer } from "./sales-customers-container"
import { SalesCustomersHeader } from "./sales-customers-header"

import { useSalesCustomerActions } from "@/hooks/sales/customer/use-sales-customer-actions"


interface SalesCustomersPageClientProps {
  initialCustomers: SalesCustomer[]
  customerSlug: string
}

export function SalesCustomersPageClient({ initialCustomers, customerSlug }: SalesCustomersPageClientProps) {
  const t = useTranslations()
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

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <SalesCustomersHeader
        title={t('customers.title')}
        description={t('customers.description')}
        newButtonText={t('customers.create')}
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

