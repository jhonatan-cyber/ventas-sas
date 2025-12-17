"use client";

;
import { useState, useEffect } from "react";

import { PhotoUpload } from "./photo-upload";

import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { UserWithDetails } from "@/lib/services/admin/user-admin-service";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithDetails;
  onSave: (data: any) => void;
}

// Función para capitalizar texto
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: UserFormDialogProps) {const [email, setEmail] = useState(user?.email || "");
  const [ci, setCi] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(user?.isSuperAdmin || false);
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<string | null>(user?.photo || null);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Validar si el formulario es válido
  const isFormValid =
    email.trim() !== "" &&
    ci.trim() !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    phone.trim() !== "";

  // Cargar roles al abrir el modal
  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch("/api/administracion/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
    } finally {
      setRolesLoading(false);
    }
  };

  // Resetear el formulario cuando el modal se abre o se cambia el usuario
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setCi((user as any).ci || "");
      // Dividir fullName en firstName y lastName
      const fullName = user.fullName || "";
      const nameParts = fullName.split(" ");
      const fName = nameParts[0] || "";
      const lName = nameParts.slice(1).join(" ") || "";
      setFirstName(fName);
      setLastName(lName);
      setAddress(user.address || "");
      setPhone(user.phone || "");
      setPhoto((user as any).photo || null);
      // Intentar obtener el rol del usuario
      // Buscar el rol en la lista de roles cargados por nombre
      const roleMatch = roles.find((r) => r.name === user.role);
      setRoleId(roleMatch?.id || "");
      setIsSuperAdmin(user.isSuperAdmin);
      setPassword("");
    } else {
      setEmail("");
      setCi("");
      setFirstName("");
      setLastName("");
      setAddress("");
      setPhone("");
      setRoleId("");
      setIsSuperAdmin(false);
      setPassword("");
    }
  }, [user, open, roles]);

  // Actualizar el rolId cuando se cargue la lista de roles
  useEffect(() => {
    if (user && roles.length > 0 && !roleId) {
      // Buscar el rol en la lista de roles cargados por nombre
      const roleMatch = roles.find((r) => r.name === user.role);
      if (roleMatch) {
        setRoleId(roleMatch.id);
      }
    }
  }, [roles, user, roleId, setRoleId]);

  // Sincronizar photo cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setPhoto((user as any).photo || null);
    } else {
      setPhoto(null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const selectedRole = roles.find((r) => r.id === roleId);
      // Combinar nombre y apellido
      const fullName = `${firstName} ${lastName}`.trim();
      const data: any = {
        email,
        ci,
        fullName,
        address,
        phone,
        role: selectedRole?.name || "user",
        roleId,
        isSuperAdmin,
        isActive: user ? user.isActive : true, // Mantener el estado actual si es edición, crear como activo si es nuevo
        photo: photo || undefined,
      };

      // Para nuevos usuarios, usar el CI como contraseña. Para edición, solo si se especificó password
      if (!user) {
        data.password = ci; // El CI será hasheado en el servidor
      } else if (password && password.trim() !== "") {
        data.password = password;
      }

      await onSave(data);
      
      // Solo cerrar el diálogo y resetear el formulario si la operación fue exitosa
      setIsLoading(false);
      
      // Resetear formulario antes de cerrar
      setEmail("");
      setCi("");
      setFirstName("");
      setLastName("");
      setAddress("");
      setPhone("");
      setRoleId("");
      setIsSuperAdmin(false);
      setPassword("");
      setPhoto(null);
      
      // Cerrar el diálogo después de resetear el formulario
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar el usuario:", error);
      // El error ya se muestra en el toast desde el hook
      // Solo necesitamos resetear el estado de carga
      setIsLoading(false);
      // No cerrar el diálogo si hay un error para que el usuario pueda corregir
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {user ? "Edit" : "New"}
            </DialogTitle>
            <DialogDescription>
              {user
                ? "Edit Description"
                : "New Description"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            {/* Foto de perfil */}
            <div className="flex justify-center">
              <PhotoUpload
                currentPhoto={photo}
                onPhotoChange={setPhoto}
                userId={user?.id}
                disabled={isLoading}
                fullName={user?.fullName || `${firstName} ${lastName}`.trim() || null}
              />
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="ci"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  {"Ci"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ci"
                  type="text"
                  placeholder={"Ci Placeholder"}
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  required
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  {"Email"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={"Email Placeholder"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {"Name"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder={"Name Placeholder"}
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(capitalizeText(e.target.value))
                    }
                    required
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {"Last Name"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder={"Last Name Placeholder"}
                    value={lastName}
                    onChange={(e) =>
                      setLastName(capitalizeText(e.target.value))
                    }
                    required
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  {"Address"}
                </Label>
                <Input
                  id="address"
                  placeholder={"Address Placeholder"}
                  value={address}
                  onChange={(e) => setAddress(capitalizeText(e.target.value))}
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              <div
                className={`grid gap-4 ${
                  isSuperAdmin ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {"Phone"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={"Phone Placeholder"}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>

                {!isSuperAdmin && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="role"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                      {"Role"}
                    </Label>
                    <Select
                      value={roleId}
                      onValueChange={setRoleId}
                      disabled={rolesLoading}
                    >
                      <SelectTrigger className="rounded-full w-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                        <SelectValue
                          placeholder={
                            rolesLoading
                              ? "Loading Roles"
                              : "Select Role"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                        {roles.map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.id}
                            className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                          >
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {roles.length === 0 && !rolesLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {"No Roles Available"}
                </p>
              )}

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {"Super Admin"}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {"Super Admin Description"}
                  </p>
                </div>
                <Switch
                  checked={isSuperAdmin}
                  onCheckedChange={(checked) => {
                    setIsSuperAdmin(checked);
                    // Limpiar el rol si se activa super admin
                    if (checked) {
                      setRoleId("");
                    }
                  }}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {"Cancel"}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full px-6"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Saving" : user ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
