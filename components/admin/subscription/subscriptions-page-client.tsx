"use client"

import { DeleteSubscriptionDialog } from "./delete-subscription-dialog"
import { SubscriptionFormDialog } from "./subscription-form-dialog"
import { SubscriptionsContainer } from "./subscriptions-container"

import { SubscriptionsHeader } from "@/components/admin/subscription/subscriptions-header"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useSubscriptionActions } from "@/hooks/admin/subscription/use-subscription-actions"

import type { SubscriptionWithDetails } from "./types"

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
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
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
              organizationName={deleteDialog.organizationName}
            />
      </div>
    </AdminLayout>
  )
}

