"use client"

import { useState } from "react"
import { CustomerOrganizationsStats } from "./customer-organizations-stats"
import { CustomerOrganizationsFilters } from "./customer-organizations-filters"
import { CustomerOrganizationsTable } from "./customer-organizations-table"
import { CustomerOrganizationsCards } from "./customer-organizations-cards"
import { CustomerOrganizationsPagination } from "./customer-organizations-pagination"

interface Customer {
  id: string
  nombre?: string
  apellido?: string
  email?: string
  razonSocial?: string
  ci?: string
  organizations: Array<{
    id: string
    organizationId: string
    isActive: boolean
    joinedAt: string
    organization: {
      id: string
      name: string
      razonSocial?: string
      nit?: string
      direccion?: string
      telefono?: string
      slug: string
      subscriptionStatus?: string
    }
  }>
}

interface Organization {
  id: string
  subscriptionStatus?: string
}

interface CustomerOrganizationsContainerProps {
  customers: Customer[]
  organizations: Organization[]
  isLoading: boolean
  onAddOrganization?: (customer: Customer) => void
  onRemoveOrganization?: (customerId: string, organizationId: string) => void
  onEditOrganization?: (organizationId: string) => void
  onToggleOrganizationStatus?: (organizationId: string, isActive: boolean) => void
  onDeleteOrganization?: (organizationId: string, organizationName: string) => void
}

export function CustomerOrganizationsContainer({
  customers,
  organizations,
  isLoading,
  onAddOrganization,
  onRemoveOrganization,
  onEditOrganization,
  onToggleOrganizationStatus,
  onDeleteOrganization,
}: CustomerOrganizationsContainerProps) {
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar clientes por búsqueda y estado
  const filteredCustomers = customers.filter((customer) => {
    // Filtrar por búsqueda
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        customer.nombre?.toLowerCase().includes(searchLower) ||
        customer.apellido?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.razonSocial?.toLowerCase().includes(searchLower) ||
        customer.ci?.toLowerCase().includes(searchLower) ||
        customer.organizations.some((org) =>
          org.organization.name.toLowerCase().includes(searchLower) ||
          org.organization.razonSocial?.toLowerCase().includes(searchLower) ||
          org.organization.nit?.toLowerCase().includes(searchLower) ||
          org.organization.slug.toLowerCase().includes(searchLower)
        )

      if (!matchesSearch) return false
    }

    // Filtrar por estado (basado en el estado de las organizaciones)
    if (statusFilter === "active") {
      // Mostrar solo clientes con al menos una organización activa
      return customer.organizations.some(
        (org) => org.organization.subscriptionStatus === 'active' || org.organization.subscriptionStatus === 'trial'
      )
    }
    if (statusFilter === "inactive") {
      // Mostrar solo clientes con todas las organizaciones inactivas o sin organizaciones
      return customer.organizations.length === 0 || 
        customer.organizations.every(
          (org) => org.organization.subscriptionStatus !== 'active' && org.organization.subscriptionStatus !== 'trial'
        )
    }
    return true // "all" - mostrar todos
  })

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Resetear a la primera página cuando cambia la búsqueda
  }

  // Calcular clientes para la página actual
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el filtro
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el tamaño
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
    const totalPages = Math.ceil(filteredCustomers.length / pageSize)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 p-0 md:p-6">
      {/* Estadísticas */}
      <CustomerOrganizationsStats customers={customers} organizations={organizations} />

      {/* Filtros */}
      <CustomerOrganizationsFilters
        onPageSizeChange={handlePageSizeChange}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {/* Cards para móvil */}
      <CustomerOrganizationsCards
        customers={currentCustomers}
        onAddOrganization={onAddOrganization}
        onRemoveOrganization={onRemoveOrganization}
        onEditOrganization={onEditOrganization}
        onToggleOrganizationStatus={onToggleOrganizationStatus}
        onDeleteOrganization={onDeleteOrganization}
      />

      {/* Tabla para desktop */}
      <div className="hidden md:block rounded-md border border-gray-200 dark:border-[#2a2a2a]">
        <CustomerOrganizationsTable
          customers={currentCustomers}
          isLoading={isLoading}
          onAddOrganization={onAddOrganization}
          onRemoveOrganization={onRemoveOrganization}
          onEditOrganization={onEditOrganization}
          onToggleOrganizationStatus={onToggleOrganizationStatus}
          onDeleteOrganization={onDeleteOrganization}
        />
      </div>

      {/* Paginación */}
      {filteredCustomers.length > 0 && (
        <CustomerOrganizationsPagination
          totalItems={filteredCustomers.length}
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

