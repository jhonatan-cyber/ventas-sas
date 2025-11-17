"use client"

import { UsuarioSas } from "@prisma/client"
import {
  User,
  Shield,
  Calendar,
  Lock,
  Edit2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { PhotoUpload } from "../usuario/photo-upload"

import { ChangePasswordDialog } from "./change-password-dialog"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type UsuarioSasWithRelations = UsuarioSas & {
  rol?: { id: string; nombre: string } | null
  sucursal?: { id: string; name: string } | null
  organization?: { id: string; name: string | null; razonSocial: string | null } | null
}

interface ProfilePageClientProps {
  initialUser: UsuarioSasWithRelations
  customerSlug: string
}

export function ProfilePageClient({ initialUser, customerSlug }: ProfilePageClientProps) {
  const t = useTranslations()
  const [user, setUser] = useState(initialUser)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    email: user.email || "",
    nombre: user.nombre || "",
    apellido: user.apellido || "",
    phone: user.phone || "",
    address: user.address || "",
    ci: user.ci || "",
    foto: user.foto || null,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/${customerSlug}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar el perfil")
        return
      }

      setUser(data)
      setFormData((prev) => ({ ...prev, foto: data.foto || null }))
      setIsEditing(false)

      // Recargar información del usuario en el header
      window.dispatchEvent(new Event("sas-user-updated"))

      toast.success("Perfil actualizado correctamente")
    } catch {
      toast.error("Error al actualizar el perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      email: user.email || "",
      nombre: user.nombre || "",
      apellido: user.apellido || "",
      phone: user.phone || "",
      address: user.address || "",
      ci: user.ci || "",
      foto: user.foto || null,
    })
    setIsEditing(false)
  }

  const getInitials = () => {
    const fullName = `${user.nombre || ""} ${user.apellido || ""}`.trim()
    if (fullName) {
      const parts = fullName.split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return fullName.slice(0, 2).toUpperCase()
    }
    return (user.email || "U").slice(0, 2).toUpperCase()
  }

  const fullName = `${user.nombre || ""} ${user.apellido || ""}`.trim() || user.email

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('profile.title') || 'Mi Perfil'}
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t('profile.description') || 'Gestiona tu información personal y configuración de cuenta'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Perfil */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('profile.personalInfo.title') || 'Información Personal'}</CardTitle>
                  <CardDescription>
                    {t('profile.personalInfo.description') || 'Actualiza tu información personal y de contacto'}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('action.edit') || 'Editar'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('form.email') || 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    className="rounded-full"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ci">{t('form.ci') || 'CI (Cédula de Identidad)'}</Label>
                  <Input
                    id="ci"
                    className="rounded-full"
                    value={formData.ci}
                    onChange={(e) => handleInputChange("ci", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">{t('form.name') || 'Nombre'}</Label>
                  <Input
                    id="nombre"
                    className="rounded-full"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">{t('form.lastName') || 'Apellido'}</Label>
                  <Input
                    id="apellido"
                    className="rounded-full"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange("apellido", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('form.phone') || 'Teléfono'}</Label>
                  <Input
                    id="phone"
                    className="rounded-full"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('form.address') || 'Dirección'}</Label>
                <Input
                  id="address"
                  className="rounded-full"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4 justify-center">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="rounded-full"
                  >
                    {isLoading ? (t('message.saving') || 'Guardando...') : (t('action.update') || 'Actualizar')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="rounded-full"
                  >
                    {t('action.cancel') || 'Cancelar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.security.title') || 'Seguridad'}</CardTitle>
              <CardDescription>
                {t('profile.security.description') || 'Gestiona tu contraseña y configuración de seguridad'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">{t('profile.security.password') || 'Contraseña'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('profile.security.lastUpdate') || 'Última actualización:'}{" "}
                      {user.passwordChangedAt
                        ? new Date(
                            user.passwordChangedAt
                          ).toLocaleDateString("es-BO")
                        : t('profile.security.never') || 'Nunca'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  {t('profile.security.changePassword') || 'Cambiar Contraseña'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Información de la cuenta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.accountInfo.title') || 'Información de la Cuenta'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                {isEditing ? (
                  <PhotoUpload
                    currentPhoto={formData.foto}
                    onPhotoChange={(photoUrl) =>
                      setFormData((prev) => ({
                        ...prev,
                        foto: photoUrl || "",
                      }))
                    }
                    disabled={isLoading}
                    fullName={fullName}
                    userId={user.id}
                    customerSlug={customerSlug}
                  />
                ) : (
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={user.foto || undefined}
                      alt="Foto de perfil"
                    />
                    <AvatarFallback className="text-2xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{t('profile.accountInfo.role') || 'Rol'}</p>
                    <p className="text-xs text-gray-500">
                      {user.rol?.nombre || t('profile.accountInfo.noRole') || 'Sin rol'}
                    </p>
                  </div>
                </div>

                {user.sucursal && (
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{t('profile.accountInfo.branch') || 'Sucursal'}</p>
                      <p className="text-xs text-gray-500">
                        {user.sucursal.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{t('profile.accountInfo.status') || 'Estado'}</p>
                    <p className="text-xs text-gray-500">
                      {user.isActive ? (t('status.active') || 'Activo') : (t('status.inactive') || 'Inactivo')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{t('profile.accountInfo.createdAt') || 'Cuenta creada'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("es-BO")}
                    </p>
                  </div>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{t('profile.accountInfo.lastLogin') || 'Último acceso'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.lastLoginAt).toLocaleDateString(
                          "es-BO"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para cambiar contraseña */}
      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        customerSlug={customerSlug}
      />
    </div>
  )
}

