"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { SubscriptionsHeader } from "@/components/admin/subscription/subscriptions-header"
import { SubscriptionsContainer } from "./subscriptions-container"
import { SubscriptionFormDialog } from "./subscription-form-dialog"
import { DeleteSubscriptionDialog } from "./delete-subscription-dialog"
import { useSubscriptionActions } from "@/hooks/admin/subscription/use-subscription-actions"

interface SubscriptionWithDetails {
  id: string
  customerId: string
  planId: string
  status: string
  billingPeriod: string
  startDate: Date
  endDate: Date | null
  autoRenew: boolean
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string
    razonSocial: string | null
    nit: string | null
    nombre: string | null
    apellido: string | null
    email: string | null
  }
  plan: {
    id: string
    name: string
    priceMonthly: number | null
    priceYearly: number | null
  }
}

interface SubscriptionsPageClientProps {
  initialSubscriptions: SubscriptionWithDetails[]
}

export function SubscriptionsPageClient({ initialSubscriptions }: SubscriptionsPageClientProps) {
  const {
    openDialog,
    setOpenDialog,
    selectedSubscription,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteDialog,
    setDeleteDialog,
  } = useSubscriptionActions()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SubscriptionsHeader
          title="Gestión de Suscripciones"
          description="Administra todas las suscripciones del sistema"
          onNewClick={handleNewClick}
        />

        <SubscriptionsContainer 
          subscriptions={initialSubscriptions} 
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
        />

        <SubscriptionFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          subscription={selectedSubscription}
          onSave={handleSave}
        />

            <DeleteSubscriptionDialog
              open={deleteDialog.open}
              onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
              onConfirm={handleDeleteConfirm}
              customerName={deleteDialog.customerName}
            />
      </div>
    </AdminLayout>
  )
}

