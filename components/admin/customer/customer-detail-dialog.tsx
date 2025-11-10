"use client"

import {
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  Clock,
  Tag,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Customer } from "@/lib/types"

interface CustomerWithDetails extends Customer {
  organizations?: Array<{
    id: string
    isActive: boolean
    joinedAt: Date | string
    organization: {
      id: string
      name: string
      slug: string
      nit: string | null
      razonSocial: string | null
      subscriptionStatus: string
      createdAt: Date | string
      updatedAt: Date | string
    }
  }>
  organization?: {
    id: string
    name: string
    slug: string
    nit: string | null
    razonSocial: string | null
    subscriptionStatus: string
    createdAt: Date | string
    updatedAt: Date | string
  } | null
}

interface CustomerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerWithDetails | null
}

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDetailDialogProps) {
  if (!customer) return null

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = () => {
    if (customer.nombre && customer.apellido) {
      return `${customer.nombre[0]}${customer.apellido[0]}`.toUpperCase()
    }
    if (customer.nombre) {
      return customer.nombre.slice(0, 2).toUpperCase()
    }
    if (customer.apellido) {
      return customer.apellido.slice(0, 2).toUpperCase()
    }
    if (customer.email) {
      return customer.email.slice(0, 2).toUpperCase()
    }
    return "C"
  }

  const displayName = customer.nombre && customer.apellido
    ? `${customer.nombre} ${customer.apellido}`
    : customer.nombre || customer.apellido || customer.razonSocial || "Cliente"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold">{displayName}</span>
                <Badge
                  className={
                    customer.isActive
                      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                      : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
                  }
                >
                  {customer.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {customer.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  {customer.email}
                </p>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Información detallada del cliente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Información Personal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              {customer.nombre && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nombre
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.nombre}
                  </p>
                </div>
              )}
              {customer.apellido && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Apellido
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.apellido}
                  </p>
                </div>
              )}
              {customer.ci && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cédula de Identidad
                  </p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {customer.ci}
                    </p>
                  </div>
                </div>
              )}
              {customer.email && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.email}
                    </p>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dirección
                  </p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.address}
                    </p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Teléfono
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.phone}
                    </p>
                  </div>
                </div>
              )}
              {customer.city && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ciudad
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.city}
                  </p>
                </div>
              )}
              {customer.country && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    País
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.country}
                  </p>
                </div>
              )}
            </div>
          </div>

          {(customer.razonSocial || customer.nit) && (
            <>
              <Separator />
              {/* Información de Empresa */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Información de Empresa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  {customer.razonSocial && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Razón Social
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.razonSocial}
                      </p>
                    </div>
                  )}
                  {customer.nit && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        NIT
                      </p>
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {customer.nit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {customer.organizations && customer.organizations.length > 0 && (
            <>
              <Separator />
              {/* Organizaciones */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizaciones ({customer.organizations.length})
                </h3>
                <div className="space-y-3 pl-6">
                  {customer.organizations.map((customerOrg) => (
                    <div
                      key={customerOrg.id}
                      className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#1a1a1a]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {customerOrg.organization.name}
                            </p>
                          </div>
                          {customerOrg.organization.razonSocial && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Razón Social: {customerOrg.organization.razonSocial}
                            </p>
                          )}
                          {customerOrg.organization.nit && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              NIT: {customerOrg.organization.nit}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                customerOrg.organization.subscriptionStatus === 'active'
                                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                  : customerOrg.organization.subscriptionStatus === 'trial'
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                                  : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
                              }
                            >
                              {customerOrg.organization.subscriptionStatus === 'active' ? 'Activa' :
                               customerOrg.organization.subscriptionStatus === 'trial' ? 'Prueba' :
                               customerOrg.organization.subscriptionStatus}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Se unió: {formatDate(customerOrg.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Información de Fechas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Información de Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cliente creado
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(customer.createdAt)}
                  </p>
                </div>
              </div>
              {customer.updatedAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Última actualización
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(customer.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

