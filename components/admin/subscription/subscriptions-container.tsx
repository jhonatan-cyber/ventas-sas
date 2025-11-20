"use client"

import { useState } from "react"

import { SubscriptionsCards } from "./subscriptions-cards"
import { SubscriptionsFilters } from "./subscriptions-filters"
import { SubscriptionsPagination } from "./subscriptions-pagination"
import { SubscriptionsStats } from "./subscriptions-stats"
import { SubscriptionsTable } from "./subscriptions-table"

import type { SubscriptionWithDetails } from "./types"

interface SubscriptionsContainerProps {
  subscriptions: SubscriptionWithDetails[]
  onEdit?: (subscription: SubscriptionWithDetails) => void
  onViewDetails?: (subscription: SubscriptionWithDetails) => void
  onToggleStatus?: (subscriptionId: string, currentStatus: string) => void
  onDelete?: (subscriptionId: string, organizationName: string) => void
}

export function SubscriptionsContainer({ subscriptions, onEdit, onViewDetails, onToggleStatus, onDelete }: SubscriptionsContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSubscriptions = subscriptions.filter(subscription => {
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const customer = subscription.customer
      const matchesSearch = 
        (customer?.nombre?.toLowerCase().includes(searchLower)) ||
        (customer?.apellido?.toLowerCase().includes(searchLower)) ||
        (customer?.email?.toLowerCase().includes(searchLower)) ||
        subscription.organization?.name?.toLowerCase().includes(searchLower) ||
        subscription.organization?.razonSocial?.toLowerCase().includes(searchLower) ||
        subscription.organization?.nit?.toLowerCase().includes(searchLower) ||
        subscription.plan.name.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    if (statusFilter === "active") return subscription.status === 'active'
    if (statusFilter === "cancelled") return subscription.status === 'cancelled'
    if (statusFilter === "trial") return subscription.status === 'trial'
    if (statusFilter === "expired") return subscription.status === 'expired'
    return true
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentSubscriptions = filteredSubscriptions.slice(startIndex, endIndex)

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    const totalPages = Math.ceil(filteredSubscriptions.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 p-0 md:p-6">
      <SubscriptionsStats subscriptions={subscriptions} />
      <SubscriptionsFilters 
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />
      {/* Cards de suscripciones (móvil) */}
      <SubscriptionsCards subscriptions={currentSubscriptions} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
      {/* Tabla de suscripciones (desktop) - Solo mostrar si hay suscripciones */}
      {subscriptions.length > 0 && (
        <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
          <SubscriptionsTable subscriptions={currentSubscriptions} onEdit={onEdit} onViewDetails={onViewDetails} onToggleStatus={onToggleStatus} onDelete={onDelete} />
        </div>
      )}
      {/* Paginación - Solo mostrar si hay suscripciones */}
      {subscriptions.length > 0 && (
        <SubscriptionsPagination
          totalItems={filteredSubscriptions.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  )
}

