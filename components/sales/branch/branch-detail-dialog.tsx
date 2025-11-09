"use client";

import { Branch } from "@prisma/client";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface BranchDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: (Branch & {
    organization?: {
      id: string;
      razonSocial: string | null;
      name: string | null;
      slug: string | null;
    } | null;
    _count?: { usuariosSas: number };
  }) | null;
  customerSlug: string;
}

interface UsuarioAsociado {
  id: string;
  nombre: string | null;
  apellido: string | null;
  ci: string | null;
  correo: string | null;
  telefono: string | null;
  isActive: boolean;
  foto: string | null;
  rol?: {
    id: string;
    nombre: string;
  } | null;
}

export function BranchDetailDialog({
  open,
  onOpenChange,
  branch,
  customerSlug,
}: BranchDetailDialogProps) {
  const [usuarios, setUsuarios] = useState<UsuarioAsociado[]>([]);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

  useEffect(() => {
    if (open && branch?.id) {
      loadUsuarios();
    } else {
      setUsuarios([]);
    }
  }, [open, branch?.id, customerSlug]);

  const loadUsuarios = async () => {
    if (!branch?.id) return;
    
    setIsLoadingUsuarios(true);
    try {
      // Usar endpoint optimizado específico para usuarios de sucursal
      const response = await fetch(
        `/api/${customerSlug}/sucursales/${branch.id}/usuarios`,
        {
          credentials: 'include',
          cache: 'no-store' // Evitar cache para obtener datos actualizados
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []);
      } else {
        console.error("Error cargando usuarios:", response.statusText);
        setUsuarios([]);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setUsuarios([]);
    } finally {
      setIsLoadingUsuarios(false);
    }
  };

  if (!branch) return null;

  const usuariosActivos = usuarios.filter((u) => u.isActive).length;
  const usuariosInactivos = usuarios.filter((u) => !u.isActive).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span>Detalles de la Sucursal</span>
            </DialogTitle>
            <DialogDescription>
              Información completa de la sucursal y usuarios asociados
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
          {/* Información de la Sucursal */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Información General
            </h3>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex items-start gap-3">
             
                <div className="flex-1 space-y-2.5">
                  {/* Nombre y Estado en la misma línea */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {branch.name}
                      </p>
                    </div>
                    <Badge
                      className={
                        branch.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 flex-shrink-0"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800 flex-shrink-0"
                      }
                    >
                      {branch.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activa
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactiva
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Información de contacto en grid compacto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {branch.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-white truncate">{branch.email}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-white">{branch.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Dirección */}
                  {branch.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-900 dark:text-white">{branch.address}</span>
                    </div>
                  )}

                  {/* Estadísticas y fechas en una línea compacta */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <Users className="h-3 w-3" />
                      <span>
                        <span className="font-semibold text-gray-900 dark:text-white">{branch._count?.usuariosSas || 0}</span> usuarios
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Creada: {new Date(branch.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {branch.updatedAt && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Actualizada: {new Date(branch.updatedAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Listado de Usuarios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Usuarios Asociados
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Total: <span className="font-semibold">{usuarios.length}</span>
                </span>
                <span className="text-green-600 dark:text-green-400">
                  Activos: <span className="font-semibold">{usuariosActivos}</span>
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                  Inactivos: <span className="font-semibold">{usuariosInactivos}</span>
                </span>
              </div>
            </div>

            {isLoadingUsuarios ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 border border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
                </div>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 border border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No hay usuarios asociados a esta sucursal
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {usuarios.map((usuario) => {
                    const userInitials = `${usuario.nombre?.[0]?.toUpperCase() || ""}${
                      usuario.apellido?.[0]?.toUpperCase() || ""
                    }`;
                    const fullName = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();

                    return (
                      <div
                        key={usuario.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            {usuario.foto ? (
                              <AvatarImage 
                                src={usuario.foto} 
                                alt={fullName}
                                key={usuario.foto}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                              {userInitials || <User className="h-5 w-5" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {fullName || "Sin nombre"}
                              </p>
                              <Badge
                                className={
                                  usuario.isActive
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                                }
                              >
                                {usuario.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {usuario.ci && (
                                <span>
                                  <span className="font-medium">CI:</span> {usuario.ci}
                                </span>
                              )}
                              {usuario.correo && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {usuario.correo}
                                </span>
                              )}
                              {usuario.telefono && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {usuario.telefono}
                                </span>
                              )}
                              {usuario.rol && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  <span className="font-medium">Rol:</span> {usuario.rol.nombre}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer estático */}
        <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

