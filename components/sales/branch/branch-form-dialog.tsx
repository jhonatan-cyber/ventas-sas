"use client";

import { Branch } from "@prisma/client";
import { useState, useEffect } from "react";

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

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch;
  onSave: (data: any) => void;
}

export function BranchFormDialog({
  open,
  onOpenChange,
  branch,
  onSave,
}: BranchFormDialogProps) {

const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const capitalizeWords = (text: string) => {
    // Preservar espacio(s) al final para no bloquear la escritura
    const trailing = /\s+$/.exec(text)?.[0] || "";
    const core = text.replace(/\s+$/, "");
    if (!core) return trailing;
    const cap = core
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return cap + trailing;
  };

  useEffect(() => {
    if (branch) {
      setName(branch.name || "");
      setEmail(branch.email || "");
      setPhone(branch.phone || "");
      setAddress(branch.address || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
    }
  }, [branch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
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
              {branch ? "Editar Sucursal" : "Nueva Sucursal"}
            </DialogTitle>
            <DialogDescription>
              {branch
                ? "Modifica la información de la sucursal existente"
                : "Completa la información para crear una nueva sucursal"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-2">
              <Label htmlFor="name">
                {"Nombre"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(capitalizeWords(e.target.value))}
                placeholder={"Name Placeholder"}
                required
                disabled={isLoading}
                className="rounded-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{"Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={"Email Placeholder"}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{"Teléfono"}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={"Phone Placeholder"}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{"Dirección"}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(capitalizeWords(e.target.value))}
                placeholder={"Address Placeholder"}
                disabled={isLoading}
                className="rounded-full"
              />
            </div>
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
              {"Cancelar"}
            </Button>
            <Button
              type="submit"
              variant="new"
              disabled={isLoading || !name.trim()}
              className="w-full sm:w-auto rounded-full"
            >
              {isLoading ? "Guardando..." : branch ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
