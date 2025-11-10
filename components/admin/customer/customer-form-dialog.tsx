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
import { Button } from "@/components/ui/button";
import { Customer } from "@/lib/types";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
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

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSave,
}: CustomerFormDialogProps) {
  const [ci, setCi] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setCi(customer.ci || "");
      setNombre(customer.nombre || "");
      setApellido(customer.apellido || "");
      setDireccion(customer.address || "");
      setTelefono(customer.phone || "");
      setEmail(customer.email || "");
    } else {
      setCi("");
      setNombre("");
      setApellido("");
      setDireccion("");
      setTelefono("");
      setEmail("");
    }
  }, [customer, open]);

  // Validar si todos los campos requeridos están llenos
  const isFormValid =
    ci.trim() !== "" &&
    nombre.trim() !== "" &&
    apellido.trim() !== "" &&
    telefono.trim() !== "" &&
    email.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);

    const customerData = {
      ci,
      nombre,
      apellido,
      address: direccion,
      phone: telefono,
      email,
    };

    onSave(customerData);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {customer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {customer
                ? "Modifica los datos del cliente"
                : "Completa los datos para crear un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-6">
              {/* CI */}
              <div className="space-y-2">
                <Label
                  htmlFor="ci"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  CI (Cédula de Identidad){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ci"
                  placeholder="1234567"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  required
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              {/* Nombre y Apellido en una fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="nombre"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    placeholder="Juan"
                    value={nombre}
                    onChange={(e) => setNombre(capitalizeText(e.target.value))}
                    required
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="apellido"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apellido"
                    placeholder="Pérez"
                    value={apellido}
                    onChange={(e) =>
                      setApellido(capitalizeText(e.target.value))
                    }
                    required
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <Label
                  htmlFor="direccion"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  placeholder="Calle Principal 123"
                  value={direccion}
                  onChange={(e) => setDireccion(capitalizeText(e.target.value))}
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              {/* Teléfono y Email en una fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="telefono"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telefono"
                    placeholder="+591 70000000"
                    value={telefono}
                    required
                    onChange={(e) => setTelefono(e.target.value)}
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Correo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
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
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full px-6"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Guardando..." : customer ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
