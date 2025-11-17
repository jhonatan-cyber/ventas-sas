"use client"

import {
  FileText,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

type UsuarioSasWithRelations = {
  id: string
  nombre: string
  apellido: string
  ci?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  foto?: string | null
  isActive: boolean
  createdAt: Date
  rol?: { id: string; nombre: string } | null
  sucursal?: { id: string; name: string } | null
}

interface UsuarioSasDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioSasWithRelations | null
}

export function UsuarioSasDetailDialog({
  open,
  onOpenChange,
  usuario,
}: UsuarioSasDetailDialogProps) {
  if (!usuario) return null

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

  const fullName = `${usuario.nombre} ${usuario.apellido}`
  const initials = `${usuario.nombre?.[0]?.toUpperCase() || ''}${usuario.apellido?.[0]?.toUpperCase() || ''}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-1">
                <DialogDescription className="mt-1">
                  Información detallada del usuario del sistema
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
            {/* Foto y nombre principal */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
              <Avatar className="w-20 h-20">
                {usuario.foto ? (
                  <AvatarImage src={usuario.foto} alt={fullName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold text-xl">
                  {initials || <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {fullName}
                </h3>
                {usuario.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{usuario.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Información General */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Información General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nombre Completo</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {fullName}
                  </p>
                </div>
                {usuario.ci && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cédula de Identidad</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {usuario.ci}
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                  <Badge
                    variant="secondary"
                    className={
                      usuario.isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                        : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                    }
                  >
                    {usuario.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </Badge>
                </div>
                {usuario.phone && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {usuario.phone}
                      </p>
                    </div>
                  </div>
                )}
                {usuario.email && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Correo Electrónico</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {usuario.email}
                      </p>
                    </div>
                  </div>
                )}
                {usuario.address && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dirección</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {usuario.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Rol y Sucursal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Asignaciones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rol</p>
                  {usuario.rol ? (
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {usuario.rol.nombre}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Sin rol asignado
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
                  {usuario.sucursal ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
                        {usuario.sucursal.name}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Todas las sucursales
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Información del Sistema */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Información del Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Creación</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(usuario.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID del Usuario</p>
                  <p className="text-sm font-mono text-gray-600 dark:text-gray-400 text-xs break-all">
                    {usuario.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer estático */}
          <div className="flex justify-center border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="new"
              onClick={() => onOpenChange(false)}
              className="rounded-full w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

