"use client"

import { Plus, Building2, User, Edit, Power, PowerOff, Trash2, MapPin, Phone, Hash, Link2 } from "lucide-react"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
      address?: string
      phone?: string
      slug: string
      subscriptionStatus?: string
      logoUrl?: string
      whiteLabelBranding?: {
        logoUrl?: string
      }
    }
  }>
  ci?: string
}

interface CustomerOrganizationsTableProps {
  customers: Customer[]
  isLoading: boolean
  onAddOrganization: (customer: Customer) => void
  onRemoveOrganization: (customerId: string, organizationId: string) => void
  onEditOrganization?: (organizationId: string) => void
  onToggleOrganizationStatus?: (organizationId: string, isActive: boolean) => void
  onDeleteOrganization?: (organizationId: string, organizationName: string) => void
}

export function CustomerOrganizationsTable({
  customers,
  isLoading,
  onAddOrganization,
  onEditOrganization,
  onToggleOrganizationStatus,
  onDeleteOrganization,
}: CustomerOrganizationsTableProps) {
  const canEdit = useHasPermission("organizaciones_editar")
  const canDelete = useHasPermission("organizaciones_eliminar")
  const canActivate = useHasPermission("organizaciones_activar")
  const canDeactivate = useHasPermission("organizaciones_desactivar")

  const getCustomerName = (customer: Customer) => {
    if (customer.razonSocial) return customer.razonSocial
    const fullName = `${customer.nombre || ""} ${customer.apellido || ""}`.trim()
    return fullName || "Sin nombre"
  }

  if (isLoading) {
    return (
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a]">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-12 w-12 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    No se encontraron clientes
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  // Crear una lista plana de organizaciones con sus clientes
  type OrganizationRow = {
    customer: Customer
    organization: {
      id: string
      name: string
      razonSocial?: string
      nit?: string
      address?: string
      phone?: string
      slug: string
      subscriptionStatus?: string
      logoUrl?: string
      whiteLabelBranding?: {
        logoUrl?: string
      }
    } | null
    customerOrganization: {
      id: string
      organizationId: string
      isActive: boolean
      joinedAt: string
      organization: {
        id: string
        name: string
        razonSocial?: string
        nit?: string
        address?: string
        phone?: string
        slug: string
        subscriptionStatus?: string
        logoUrl?: string
        whiteLabelBranding?: {
          logoUrl?: string
        }
      }
    } | null
  }

  const organizationRows: OrganizationRow[] = customers.flatMap((customer) =>
    customer.organizations.length > 0
      ? customer.organizations.map((org) => ({
          customer,
          organization: org.organization,
          customerOrganization: org,
        } as OrganizationRow))
      : [
          {
            customer,
            organization: null,
            customerOrganization: null,
          } as OrganizationRow,
        ]
  )

  return (
    <div className="rounded-md border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-[#1a1a1a]">
            <TableHead className="font-semibold">Empresa</TableHead>
            <TableHead className="font-semibold">Dirección</TableHead>
            <TableHead className="font-semibold">Teléfono</TableHead>
            <TableHead className="font-semibold">NIT / CI</TableHead>
            <TableHead className="font-semibold">Slug</TableHead>
            <TableHead className="font-semibold">Cliente</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizationRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-12 w-12 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    No se encontraron organizaciones
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            organizationRows.map((row, index) => {
              if (!row.organization) {
                // Cliente sin organizaciones - mostrar solo el botón de agregar
                return (
                  <TableRow key={`customer-${row.customer.id}`} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <TableCell colSpan={6} className="text-gray-400 italic">
                      {getCustomerName(row.customer)} - Sin organizaciones
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAddOrganization(row.customer)}
                                disabled={!canEdit}
                                className="h-8 w-8 p-0"
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
                    </TableCell>
                  </TableRow>
                )
              }

              return (
                <TableRow key={`${row.customer.id}-${row.organization.id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage 
                          src={(row.organization as any).whiteLabelBranding?.logoUrl || (row.organization as any).logoUrl || undefined} 
                          alt={row.organization.razonSocial || row.organization.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                          {(row.organization.razonSocial || row.organization.name).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
            
                      <span className="font-medium text-gray-900 dark:text-white">
                        {row.organization.razonSocial || row.organization.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {row.organization.address || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {row.organization.phone || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {row.organization.nit || row.customer.ci || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {row.organization.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {row.customer.nombre || row.customer.apellido
                            ? `${row.customer.nombre || ""} ${row.customer.apellido || ""}`.trim()
                            : getCustomerName(row.customer)}
                        </p>
                        {row.customer.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {row.customer.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEditOrganization && row.organization && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditOrganization(row.organization!.id)}
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

                      {onToggleOrganizationStatus && row.organization && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const isActive = row.organization!.subscriptionStatus === 'active' || row.organization!.subscriptionStatus === 'trial'
                                    onToggleOrganizationStatus(row.organization!.id, !isActive)
                                  }}
                                  disabled={
                                    (row.organization!.subscriptionStatus === 'active' || row.organization!.subscriptionStatus === 'trial') && !canDeactivate ||
                                    (row.organization!.subscriptionStatus !== 'active' && row.organization!.subscriptionStatus !== 'trial') && !canActivate
                                  }
                                  className={`h-8 w-8 p-0 ${
                                    (row.organization!.subscriptionStatus === 'active' || row.organization!.subscriptionStatus === 'trial')
                                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                      : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {(row.organization!.subscriptionStatus === 'active' || row.organization!.subscriptionStatus === 'trial') ? (
                                    <PowerOff className="h-4 w-4" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {(row.organization!.subscriptionStatus === 'active' || row.organization!.subscriptionStatus === 'trial')
                                ? (canDeactivate ? "Desactivar organización" : "No tiene permiso para desactivar organizaciones")
                                : (canActivate ? "Activar organización" : "No tiene permiso para activar organizaciones")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {onDeleteOrganization && row.organization && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteOrganization(row.organization!.id, row.organization!.razonSocial || row.organization!.name)}
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
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

