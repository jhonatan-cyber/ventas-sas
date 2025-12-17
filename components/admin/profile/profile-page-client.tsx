"use client";

import { Profile } from "@prisma/client";
import {
  User,
  Shield,
  Calendar,
  Lock,
  Edit2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PhotoUpload } from "../user/photo-upload";

import { ChangePasswordDialog } from "./change-password-dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";




interface ProfilePageClientProps {
  initialProfile: Profile;
}

export function ProfilePageClient({ initialProfile }: ProfilePageClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: profile.email,
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    address: profile.address || "",
    ci: profile.ci || "",
    photo: (profile as any).photo || null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/administracion/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al actualizar el perfil");
        return;
      }

      setProfile(data);
      setFormData((prev) => ({ ...prev, photo: data.photo || null }));
      setIsEditing(false);

      // Recargar información del usuario en el header
      window.dispatchEvent(new Event("Profile-updated"));

      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: profile.email,
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      address: profile.address || "",
      ci: profile.ci || "",
      photo: (profile as any).photo || null,
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    if (profile.fullName) {
      const parts = profile.fullName.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return profile.fullName.slice(0, 2).toUpperCase();
    }
    return profile.email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Mi Perfil
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Perfil */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y de contacto
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
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    className="rounded-full"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ci">CI (Cédula de Identidad)</Label>
                  <Input
                    id="ci"
                    className="rounded-full"
                    value={formData.ci}
                    onChange={(e) => handleInputChange("ci", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
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
                <Label htmlFor="address">Dirección</Label>
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
                    {isLoading ? "Guardando..." : "Actualizar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="rounded-full"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Gestiona tu contraseña y configuración de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium">Contraseña</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Última actualización:{" "}
                      {profile.passwordChangedAt
                        ? new Date(
                            profile.passwordChangedAt
                          ).toLocaleDateString("es-BO")
                        : "Nunca"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  Cambiar Contraseña
                </Button>
              </div>

              {profile.twoFactorEnabled && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium">
                        Autenticación de dos factores
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Habilitada desde{" "}
                        {profile.twoFactorEnabledAt
                          ? new Date(
                              profile.twoFactorEnabledAt
                            ).toLocaleDateString("es-BO")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full" disabled>
                    Configurar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Información de la cuenta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                {isEditing ? (
                  <PhotoUpload
                    currentPhoto={formData.photo}
                    onPhotoChange={(photoUrl) =>
                      setFormData((prev) => ({
                        ...prev,
                        photo: photoUrl || "",
                      }))
                    }
                    disabled={isLoading}
                    fullName={profile.fullName}
                  />
                ) : (
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={(profile as any).photo || undefined}
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
                    <p className="text-sm font-medium">Rol</p>
                    <p className="text-xs text-gray-500">
                      {profile.isSuperAdmin
                        ? "Super Administrador"
                        : profile.role || "Usuario"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Estado</p>
                    <p className="text-xs text-gray-500">
                      {profile.isActive ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Cuenta creada</p>
                    <p className="text-xs text-gray-500">
                      {new Date(profile.createdAt).toLocaleDateString("es-BO")}
                    </p>
                  </div>
                </div>

                {profile.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Último acceso</p>
                      <p className="text-xs text-gray-500">
                        {new Date(profile.lastLoginAt).toLocaleDateString(
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
      />
    </div>
  );
}
