"use client";


import { Branch } from "@prisma/client";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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
import { formatDateWithPreferences } from "@/lib/utils/preferences";

interface BranchDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch:
    | (Branch & {
        organization?: {
          id: string;
          razonSocial: string | null;
          name: string | null;
          slug: string | null;
        } | null;
        _count?: { usuariosSas: number };
      })
    | null;
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

  const loadUsuarios = useCallback(async () => {
    if (!branch?.id) return;

    setIsLoadingUsuarios(true);
    try {
      // Usar endpoint optimizado específico para usuarios de sucursal
      const response = await fetch(
        `/api/${customerSlug}/sucursales/${branch.id}/usuarios`,
        {
          credentials: "include",
          cache: "no-store", // Evitar cache para obtener datos actualizados
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
  }, [branch?.id, customerSlug]);

  useEffect(() => {
    if (open && branch?.id) {
      loadUsuarios();
    } else {
      setUsuarios([]);
    }
  }, [open, branch?.id, loadUsuarios]);

  if (!branch) return null;

  const usuariosActivos = usuarios.filter((u) => u.isActive).length;
  const usuariosInactivos = usuarios.filter((u) => !u.isActive).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2 text-center sm:text-left">
            <DialogTitle className="text-base sm:text-lg">
              {"Title"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {"Description"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
          {/* Información de la Sucursal */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {"General Info"}
            </h3>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-[#2a2a2a]">
              <div className="space-y-3">
                {/* Nombre y Estado */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                      {branch.name}
                    </p>
                  </div>
                  <Badge
                    className={
                      branch.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 flex-shrink-0 w-fit"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800 flex-shrink-0 w-fit"
                    }
                  >
                    {branch.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {"Active"}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        {"Inactive"}
                      </>
                    )}
                  </Badge>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2">
                  {branch.email && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900 dark:text-white truncate">
                        {branch.email}
                      </span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900 dark:text-white">
                        {branch.phone}
                      </span>
                    </div>
                  )}
                  {branch.address && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-900 dark:text-white break-words">
                        {branch.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Estadísticas y fechas */}
                <div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2a] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {branch._count?.usuariosSas || 0}
                      </span>{" "}
                      {"Users"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {"Created"}:{" "}
                        {formatDateWithPreferences(
                          branch.createdAt,
                          customerSlug
                        )}
                      </span>
                    </div>
                    {branch.updatedAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {"Updated"}:{" "}
                          {formatDateWithPreferences(
                            branch.updatedAt,
                            customerSlug
                          )}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {"Associated Users"}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {"Total"}:{" "}
                  <span className="font-semibold">{usuarios.length}</span>
                </span>
                <span className="text-green-600 dark:text-green-400">
                  {"Active"}:{" "}
                  <span className="font-semibold">{usuariosActivos}</span>
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                  {"Inactive"}:{" "}
                  <span className="font-semibold">{usuariosInactivos}</span>
                </span>
              </div>
            </div>

            {isLoadingUsuarios ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 border border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {"Cargando..."}
                  </p>
                </div>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-8 border border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {"No Users"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {usuarios.map((usuario) => {
                    const userInitials = `${
                      usuario.nombre?.[0]?.toUpperCase() || ""
                    }${usuario.apellido?.[0]?.toUpperCase() || ""}`;
                    const fullName = `${usuario.nombre || ""} ${
                      usuario.apellido || ""
                    }`.trim();

                    return (
                      <div
                        key={usuario.id}
                        className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                            {usuario.foto ? (
                              <AvatarImage
                                src={usuario.foto}
                                alt={fullName}
                                key={usuario.foto}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold text-xs sm:text-sm">
                              {userInitials || (
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                {fullName || "Sin nombre"}
                              </p>
                              <Badge
                                className={
                                  usuario.isActive
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 w-fit text-xs"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800 w-fit text-xs"
                                }
                              >
                                {usuario.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {usuario.ci && (
                                <span className="truncate">
                                  <span className="font-medium">CI:</span>{" "}
                                  {usuario.ci}
                                </span>
                              )}
                              {usuario.correo && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {usuario.correo}
                                  </span>
                                </span>
                              )}
                              {usuario.telefono && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  {usuario.telefono}
                                </span>
                              )}
                              {usuario.rol && (
                                <span className="text-blue-600 dark:text-blue-400 truncate">
                                  <span className="font-medium">Rol:</span>{" "}
                                  {usuario.rol.nombre}
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
        <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 py-3 sm:py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
          <Button
            type="button"
            variant="new"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full"
          >
            {"Cerrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
