"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { CashRegisterWithRelations } from "./types"

interface CashRegisterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister?: CashRegisterWithRelations;
  customerSlug: string;
  onSave: (data: any) => void;
}

const formatDateForName = (date: Date) =>
  date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const getDefaultCashRegisterName = () => {
  const now = new Date();
  const weekday = now
    .toLocaleDateString("es-BO", { weekday: "long" })
    .toLowerCase();
  return `Caja ${
    weekday.charAt(0).toUpperCase() + weekday.slice(1)
  } ${formatDateForName(now)}`;
};

const getCurrentDateTimeDisplay = () =>
  new Date().toLocaleString("es-BO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function CashRegisterFormDialog({
  open,
  onOpenChange,
  cashRegister,
  customerSlug,
  onSave,
}: CashRegisterFormDialogProps) {
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>(
    getCurrentDateTimeDisplay()
  );

  // Cargar sucursales
  useEffect(() => {
    if (open) {
      loadBranches();
    }
  }, [open, customerSlug]);

  // Cargar datos de la caja si existe
  useEffect(() => {
    if (cashRegister && open) {
      setName(cashRegister.name || "");
      setBranchId(cashRegister.branchId || "");
      setOpeningBalance(Number(cashRegister.openingBalance).toString());
    } else if (!cashRegister && open) {
      setName(getDefaultCashRegisterName());
      setBranchId("");
      setOpeningBalance("0");
    }
  }, [cashRegister, open]);

  const loadBranches = async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/${customerSlug}/sucursales`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        branchId: branchId || undefined,
        openingBalance: parseFloat(openingBalance) || 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (branches.length === 1) {
      setBranchId(branches[0].id);
    }
  }, [branches, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateDateTime = () =>
      setCurrentDateTime(getCurrentDateTimeDisplay());
    updateDateTime();

    const intervalId = window.setInterval(updateDateTime, 1000);

    return () => window.clearInterval(intervalId);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cashRegister ? "Editar Caja" : "Nueva Caja"}
          </DialogTitle>
          <DialogDescription>
            {cashRegister
              ? "Modifica los datos de la caja"
              : "Completa los datos para crear una nueva caja registradora"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre generado */}
            <div className="space-y-2">
              <Label>Nombre asignado</Label>
              <div className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {name}
              </div>
            </div>

            {/* Sucursal */}
            {branches.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor="branchId">Sucursal</Label>
                <Select
                  value={branchId || undefined}
                  onValueChange={setBranchId}
                  disabled={isLoading || isLoadingData}
                >
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Seleccione una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : branches.length === 0 ? (
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <div className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  Sin sucursales registradas
                </div>
              </div>
            ) : null}

            {/* Balance inicial (solo si es nueva caja) */}
            {!cashRegister && (
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Balance Inicial</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                  className="rounded-full"
                />
                <p className="text-xs text-gray-500">
                  Este será el balance inicial cuando la caja se abra por
                  primera vez
                </p>
              </div>
            )}
            {/* Fecha y hora actual */}
            <div className="space-y-2">
              <Label htmlFor="currentDateTime">Fecha y hora</Label>
              <Input
                id="currentDateTime"
                value={currentDateTime}
                readOnly
                disabled={isLoading || isLoadingData}
                className="rounded-full"
              />
            </div>
          </div>
          <DialogFooter className="justify-center sm:justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="new"
              className="rounded-full"
              disabled={isLoading || !name.trim()}
            >
              {isLoading
                ? "Guardando..."
                : cashRegister
                ? "Actualizar"
                : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
