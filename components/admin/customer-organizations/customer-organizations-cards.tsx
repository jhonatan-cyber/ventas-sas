"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Mail, Trash2, User, Edit, Power, PowerOff } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHasPermission } from "@/hooks/admin/use-user-permissions"

interface Customer {
  id: string
  nombre?: string
  apellido?: string
  email?: string
  razonSocial?: string
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
      slug: string
      subscriptionStatus?: string
    }
  }>
}

interface CustomerOrganizationsCardsProps {
  customers: Customer[]
  onAddOrganization: (customer: Customer) => void
  onRemoveOrganization: (customerId: string, organizationId: string) => void
  onEditOrganization?: (organizationId: string) => void
  onToggleOrganizationStatus?: (organizationId: string, isActive: boolean) => void
  onDeleteOrganization?: (organizationId: string, organizationName: string) => void
}

export function CustomerOrganizationsCards({
  customers,
  onAddOrganization,
  onRemoveOrganization,
  onEditOrganization,
  onToggleOrganizationStatus,
  onDeleteOrganization,
}: CustomerOrganizationsCardsProps) {
  const canEdit = useHasPermission("organizaciones_editar")
  const canDelete = useHasPermission("organizaciones_eliminar")
  const canActivate = useHasPermission("organizaciones_activar")
  const canDeactivate = useHasPermission("organizaciones_desactivar")

  const getCustomerName = (customer: Customer) => {
    if (customer.razonSocial) return customer.razonSocial
    const fullName = `${customer.nombre || ""} ${customer.apellido || ""}`.trim()
    return fullName || "Sin nombre"
  }

  return (
    <div className="grid gap-4 md:hidden">
      {customers.map((customer) => (
        <Card key={customer.id} className="border-gray-200 dark:border-[#2a2a2a]">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {getCustomerName(customer).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{getCustomerName(customer)}</CardTitle>
                  {customer.email && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{customer.email}</span>
                    </CardDescription>
                  )}
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddOrganization(customer)}
                        disabled={!canEdit}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Agregar organización</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {customer.organizations.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este cliente no tiene organizaciones asignadas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-start justify-between gap-3 p-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222222] transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {org.organization.razonSocial || org.organization.name}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {org.organization.razonSocial && org.organization.razonSocial !== org.organization.name && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {org.organization.name}
                            </p>
                          )}
                          {org.organization.nit && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              NIT: {org.organization.nit}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {org.organization.slug}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditOrganization && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditOrganization(org.organizationId)}
                                  disabled={!canEdit}
                                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canEdit ? "Editar organización" : "No tiene permiso para editar organizaciones"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {onToggleOrganizationStatus && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Determinar si está activa basado en subscriptionStatus
                                    const isActive = org.organization.subscriptionStatus === 'active' || org.organization.subscriptionStatus === 'trial'
                                    onToggleOrganizationStatus(org.organizationId, !isActive)
                                  }}
                                  disabled={
                                    (org.organization.subscriptionStatus === 'active' || org.organization.subscriptionStatus === 'trial') && !canDeactivate ||
                                    (org.organization.subscriptionStatus !== 'active' && org.organization.subscriptionStatus !== 'trial') && !canActivate
                                  }
                                  className={`h-8 w-8 p-0 ${
                                    (org.organization.subscriptionStatus === 'active' || org.organization.subscriptionStatus === 'trial')
                                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                      : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {(org.organization.subscriptionStatus === 'active' || org.organization.subscriptionStatus === 'trial') ? (
                                    <PowerOff className="h-4 w-4" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {(org.organization.subscriptionStatus === 'active' || org.organization.subscriptionStatus === 'trial')
                                ? (canDeactivate ? "Desactivar organización" : "No tiene permiso para desactivar organizaciones")
                                : (canActivate ? "Activar organización" : "No tiene permiso para activar organizaciones")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {onDeleteOrganization && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteOrganization(org.organizationId, org.organization.razonSocial || org.organization.name)}
                                  disabled={!canDelete}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canDelete ? "Eliminar organización" : "No tiene permiso para eliminar organizaciones"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

