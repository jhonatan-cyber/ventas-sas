"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { UsuarioSas, RoleSas, Branch } from "@prisma/client";
import { InfoIcon } from "lucide-react";

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
      setDireccion(usuario.direccion || "");
      setTelefono(usuario.telefono || "");
      setCorreo(usuario.correo || "");
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
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFoto(file.name);
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
        ci: ci.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        rolId: rolId,
      };

      // Campos opcionales
      if (correo) data.correo = correo.trim();
      if (direccion) data.direccion = direccion.trim();
      if (foto) data.foto = foto.trim();

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {usuario ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {usuario
              ? "Modifica los datos del usuario"
              : "Completa los datos para crear un nuevo usuario"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ci">
                  CI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ci"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Cédula de Identidad"
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
                  placeholder="Nombre"
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apellido">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(capitalizeWords(e.target.value))}
                  placeholder="Apellido"
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
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(capitalizeWords(e.target.value))}
                  placeholder="Dirección completa"
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            {showSucursalSelector && (
              <div className="space-y-2">
                <Label htmlFor="sucursalId">Sucursal</Label>
                <Select
                  value={sucursalId}
                  onValueChange={setSucursalId}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Seleccionar sucursal" />
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
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <InfoIcon className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <CardDescription className="text-blue-900 dark:text-blue-100">
                      <strong>Nota:</strong> La contraseña del usuario será
                      automáticamente su número de CI.
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter className="justify-center sm:justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full"
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
              className="rounded-full"
            >
              {isLoading ? "Guardando..." : usuario ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
