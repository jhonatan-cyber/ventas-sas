"use client";

import { useTranslations } from "next-intl";

import { UsuarioSas, RoleSas } from "@prisma/client";
import { InfoIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UsuarioSasFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: UsuarioSas & { rol?: any; sucursal?: any };
  roles: (RoleSas & { customer?: any; sucursal?: any })[];
  sucursales: { id: string; name: string }[];
  onSave: (data: any) => void;
  defaultSucursalId?: string;
}

export function UsuarioSasFormDialog({
  open,
  onOpenChange,
  usuario,
  roles,
  sucursales,
  onSave,
  defaultSucursalId,
}: UsuarioSasFormDialogProps) {
  const t = useTranslations()
  const [ci, setCi] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [rolId, setRolId] = useState<string>("");
  const [foto, setFoto] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [sucursalId, setSucursalId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Determinar si debemos mostrar el selector de sucursales
  const showSucursalSelector = sucursales.length > 1;

  const capitalizeWords = (text: string) => {
    // Preservar espacio(s) al final para no bloquear la escritura
    const trailing = /\s+$/.exec(text)?.[0] || ""
    const core = text.replace(/\s+$/,'')
    if (!core) return trailing
    const cap = core
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    return cap + trailing
  }

  useEffect(() => {
    if (usuario) {
      setCi(usuario.ci || "");
      setNombre(usuario.nombre || "");
      setApellido(usuario.apellido || "");
      setDireccion(usuario.address || "");
      setTelefono(usuario.phone || "");
      setCorreo(usuario.email || "");
      setRolId(usuario.rolId || "");
      setFoto(usuario.foto || "");
      setFotoPreview(usuario.foto || "");
      setSucursalId(usuario.sucursalId || "");
    } else {
      setCi("");
      setNombre("");
      setApellido("");
      setDireccion("");
      setTelefono("");
      setCorreo("");
      setRolId("");
      setFoto("");
      setFotoPreview("");
      // Si hay sucursal por defecto y solo hay una, usarla automáticamente
      setSucursalId(defaultSucursalId || "");
    }
  }, [usuario, open, defaultSucursalId]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.");
        e.target.value = "";
        return;
      }

      // Validar tipo de archivo
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert("Tipo de archivo no válido. Por favor, selecciona una imagen (PNG, JPG, GIF o WEBP).");
        e.target.value = "";
        return;
      }

      // Crear preview y guardar data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setFotoPreview(dataUrl);
        setFoto(dataUrl); // Guardar el data URL para enviarlo
      };
      reader.readAsDataURL(file);
    } else {
      setFoto("");
      setFotoPreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obligatorios: CI, nombre, apellido, teléfono, rol
    if (
      !ci.trim() ||
      !nombre.trim() ||
      !apellido.trim() ||
      !telefono.trim() ||
      !rolId
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const data: any = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
      };

      // CI - solo si tiene valor y es válido
      if (ci && ci.trim()) {
        data.ci = ci.trim();
      }

      // Teléfono - solo si tiene valor
      if (telefono && telefono.trim()) {
        data.phone = telefono.trim();
      }

      // Rol - solo si está seleccionado
      if (rolId) {
        data.rolId = rolId;
      }

      // Campos opcionales - solo si tienen valor válido
      if (correo && correo.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(correo.trim())) {
          data.email = correo.trim().toLowerCase();
        }
      }
      if (direccion && direccion.trim()) {
        data.address = direccion.trim();
      }
      
      // Foto - enviar si es una URL válida o un data URL (base64)
      if (foto && foto.trim()) {
        // Si es una URL http/https, enviarla directamente
        if (foto.startsWith('http://') || foto.startsWith('https://')) {
          data.foto = foto.trim();
        } 
        // Si es un data URL (base64), enviarlo también (el backend lo procesará)
        else if (foto.startsWith('data:image/')) {
          data.foto = foto.trim();
        }
      }

      // Para la sucursal: si solo hay una, usar la por defecto automáticamente
      // Si hay más de una, usar la seleccionada
      if (showSucursalSelector && sucursalId) {
        data.sucursalId = sucursalId;
      } else if (!showSucursalSelector && defaultSucursalId) {
        data.sucursalId = defaultSucursalId;
      }

      await onSave(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {usuario ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {usuario
                ? "Modifica los datos del usuario"
                : "Completa los datos para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ci">
                  CI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ci"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder={t('common.placeholders.taxId')}
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(capitalizeWords(e.target.value))}
                  placeholder={t('common.placeholders.name')}
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apellido">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(capitalizeWords(e.target.value))}
                  placeholder={t('common.placeholders.lastName')}
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono"
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(capitalizeWords(e.target.value))}
                  placeholder={t('common.placeholders.address')}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            {/* Rol y Sucursal - En móvil en grid de 2 columnas cuando se muestra sucursal */}
            {showSucursalSelector ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rolId">
                    Rol <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={rolId}
                    onValueChange={setRolId}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger className="w-full rounded-full">
                      <SelectValue placeholder={t('common.placeholders.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((rol) => (
                        <SelectItem key={rol.id} value={rol.id}>
                          {rol.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sucursalId">Sucursal</Label>
                  <Select
                    value={sucursalId}
                    onValueChange={setSucursalId}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full rounded-full">
                      <SelectValue placeholder={t('common.placeholders.selectBranch')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sucursales.map((sucursal) => (
                        <SelectItem key={sucursal.id} value={sucursal.id}>
                          {sucursal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rolId">
                  Rol <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={rolId}
                  onValueChange={setRolId}
                  disabled={isLoading}
                  required
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foto">Foto</Label>
              <Input
                id="foto"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFotoChange}
                disabled={isLoading}
                className="rounded-full file:text-foreground file:border-0 file:bg-transparent"
              />
              <p className="text-xs text-muted-foreground">
                Formatos: PNG, JPG, JPEG, GIF, WEBP
              </p>
              {fotoPreview && (
                <div className="mt-2">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {!usuario && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                        <InfoIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Información importante
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1.5">
                        <p>
                          <span className="font-medium">Contraseña automática:</span> La contraseña del usuario será automáticamente su número de CI.
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          El usuario podrá cambiar su contraseña después del primer inicio de sesión.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Footer estático */}
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="new"
              disabled={
                isLoading ||
                !ci.trim() ||
                !nombre.trim() ||
                !apellido.trim() ||
                !telefono.trim() ||
                !rolId
              }
              className="w-full sm:w-auto rounded-full"
            >
              {isLoading ? "Guardando..." : usuario ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
