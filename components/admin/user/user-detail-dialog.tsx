"use client";

import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { UserWithDetails } from "@/lib/services/admin/user-admin-service";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
}: UserDetailDialogProps) {
  if (!user) return null;

  const getInitials = () => {
    if (user.fullName) {
      const parts = user.fullName.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.fullName.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={(user as any).photo || undefined} alt={user.fullName || user.email || 'Usuario'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold">
                  {user.fullName || "Sin nombre"}
                </span>
                {user.isSuperAdmin && (
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Administrador
                  </Badge>
                )}
                {!user.isSuperAdmin && user.role && (
                  <Badge variant="secondary">{user.role}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {user.email}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Información detallada del usuario del sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información Personal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nombre Completo
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.fullName || "Sin especificar"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cédula de Identidad
                </p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                    {(user as any).ci || "Sin especificar"}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.email}
                  </p>
                </div>
              </div>
              {user.phone && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Teléfono
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}
              {user.address && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dirección
                  </p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información de Cuenta */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Información de Cuenta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Rol</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      user.isSuperAdmin
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    }
                  >
                    {user.isSuperAdmin
                      ? "Super Administrador"
                      : user.role || "Sin rol"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <div className="flex items-center gap-2">
                  {user.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <Badge
                    className={
                      user.isActive
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                        : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
                    }
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

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
                  Cuenta creada
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              {user.updatedAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Última actualización
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
              {(user as any).lastLoginAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Último acceso
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate((user as any).lastLoginAt)}
                    </p>
                  </div>
                </div>
              )}
              {(user as any).passwordChangedAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Contraseña cambiada
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate((user as any).passwordChangedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4 border-t">
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
  );
}

