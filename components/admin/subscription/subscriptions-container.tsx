"use client"

import { useState } from "react"
import { SubscriptionsStats } from "./subscriptions-stats"
import { SubscriptionsFilters } from "./subscriptions-filters"
import { SubscriptionsTable } from "./subscriptions-table"
import { SubscriptionsCards } from "./subscriptions-cards"
import { SubscriptionsPagination } from "./subscriptions-pagination"

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

interface SubscriptionsContainerProps {
  subscriptions: SubscriptionWithDetails[]
  onEdit?: (subscription: SubscriptionWithDetails) => void
  onToggleStatus?: (subscriptionId: string, currentStatus: string) => void
  onDelete?: (subscriptionId: string, customerName: string) => void
}

export function SubscriptionsContainer({ subscriptions, onEdit, onToggleStatus, onDelete }: SubscriptionsContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSubscriptions = subscriptions.filter(subscription => {
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        (subscription.customer.razonSocial?.toLowerCase().includes(searchLower)) ||
        (subscription.customer.nombre?.toLowerCase().includes(searchLower)) ||
        (subscription.customer.apellido?.toLowerCase().includes(searchLower)) ||
        (subscription.customer.email?.toLowerCase().includes(searchLower)) ||
        (subscription.customer.nit?.toLowerCase().includes(searchLower)) ||
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
      {/* Tabla de suscripciones (desktop) */}
      <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
        <SubscriptionsTable subscriptions={currentSubscriptions} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
      </div>
      <SubscriptionsPagination
        totalItems={filteredSubscriptions.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

