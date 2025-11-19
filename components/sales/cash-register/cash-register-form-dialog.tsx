"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

import type { CashRegisterWithRelations } from "./types"

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


interface CashRegisterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister?: CashRegisterWithRelations;
  customerSlug: string;
  onSave: (data: any) => void;
  maxBranches?: number | null;
  openCashRegisters?: CashRegisterWithRelations[]; // Cajas abiertas para filtrar sucursales
}

const formatDateForName = (date: Date) =>
  date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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
  maxBranches: _maxBranches,
  openCashRegisters = [],
}: CashRegisterFormDialogProps) {
  const t = useTranslations()
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [branches, setBranches] = useState<any[]>([]);
  const [allBranches, setAllBranches] = useState<any[]>([]); // Todas las sucursales (sin filtrar)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>(
    getCurrentDateTimeDisplay()
  );
  const [currentUser, setCurrentUser] = useState<{ isAdmin: boolean; branchId: string | null } | null>(null);

  const loadBranches = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/${customerSlug}/sucursales`);
      if (response.ok) {
        const data = await response.json();
        const allBranchesData = data.branches || [];
        setAllBranches(allBranchesData); // Guardar todas las sucursales

        // Si el usuario NO es administrador, no necesitamos filtrar (no verá el select)
        if (!currentUser?.isAdmin) {
          setBranches(allBranchesData);
          return;
        }

        // Para administradores: filtrar sucursales con cajas abiertas
        const branchesWithOpenCashRegister = new Set(
          openCashRegisters
            .filter(register => register.isOpen && register.branchId)
            .map(register => register.branchId)
        );

        // Si estamos editando una caja existente, no filtrar su sucursal actual
        const currentBranchId = cashRegister?.branchId;

        // Filtrar sucursales: mostrar solo las que no tienen caja abierta
        // O la sucursal actual si estamos editando
        const availableBranches = allBranchesData.filter((branch: any) => {
          // Si es la sucursal de la caja que estamos editando, siempre mostrarla
          if (currentBranchId && branch.id === currentBranchId) {
            return true;
          }
          // Para nuevas cajas o otras sucursales, solo mostrar si no tienen caja abierta
          return !branchesWithOpenCashRegister.has(branch.id);
        });

        setBranches(availableBranches);
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [customerSlug, openCashRegisters, cashRegister, currentUser]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        // Verificar si el usuario es administrador (rol nombre "Administrador")
        const isAdmin = userData.rol?.nombre?.toLowerCase() === 'administrador' ||
          userData.rol?.name?.toLowerCase() === 'administrador';
        setCurrentUser({
          isAdmin,
          branchId: userData.sucursalId || userData.branchId || null
        });
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    }
  }, [customerSlug]);

  // Cargar usuario actual primero
  useEffect(() => {
    if (open) {
      loadCurrentUser();
    }
  }, [open, loadCurrentUser]);

  // Cargar sucursales después de que el usuario esté disponible
  useEffect(() => {
    if (open && currentUser !== null) {
      loadBranches();
    }
  }, [open, currentUser, loadBranches]);

  // Cargar datos de la caja si existe
  useEffect(() => {
    if (cashRegister && open) {
      setName(cashRegister.name || "");
      setBranchId(cashRegister.branchId || "");
      setOpeningBalance(Number(cashRegister.openingBalance).toString());
    } else if (!cashRegister && open) {
      // Generar nombre por defecto usando traducciones
      const now = new Date();
      const weekday = now.toLocaleDateString("es-BO", { weekday: "long" }).toLowerCase();
      const formattedDate = formatDateForName(now);
      setName(`${t('cashRegisters.title').split(' ')[0]} ${weekday.charAt(0).toUpperCase() + weekday.slice(1)
        } ${formattedDate}`);
      setBranchId("");
      setOpeningBalance("0");
    }
  }, [cashRegister, open, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Si el usuario NO es administrador, usar su sucursal automáticamente
      // Si el usuario ES administrador, permitir selección manual
      let branchIdForSubmit: string | undefined = undefined

      if (!currentUser?.isAdmin && currentUser?.branchId) {
        // Usuario NO administrador: usar su sucursal automáticamente
        branchIdForSubmit = currentUser.branchId
      } else if (shouldHideBranchSelect && branches.length === 1) {
        // Plan con una sola sucursal: asignar automáticamente
        branchIdForSubmit = branches[0].id
      } else if (currentUser?.isAdmin) {
        // Usuario administrador: permitir selección manual
        branchIdForSubmit = branchId || undefined
      } else {
        // Por defecto: sin sucursal
        branchIdForSubmit = undefined
      }

      await onSave({
        name: name.trim(),
        branchId: branchIdForSubmit,
        openingBalance: parseFloat(openingBalance) || 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ocultar select de sucursal si:
  // 1. El usuario NO es administrador - se usa su sucursal automáticamente
  // NOTA: Para administradores, siempre mostrar el select si hay sucursales disponibles
  // (incluso si maxBranches === 1, el admin puede elegir la sucursal)
  const shouldHideBranchSelect =
    currentUser !== null && !currentUser.isAdmin

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!currentUser?.isAdmin && currentUser?.branchId) {
      // Usuario NO administrador: usar su sucursal automáticamente
      setBranchId(currentUser.branchId);
    } else if (shouldHideBranchSelect && branches.length === 1) {
      // Si el select está oculto y hay una sola sucursal, seleccionarla automáticamente
      setBranchId(branches[0].id);
    } else if (branches.length === 1 && !cashRegister) {
      // Si hay una sola sucursal y no es edición, seleccionarla
      setBranchId(branches[0].id);
    }
  }, [branches, open, shouldHideBranchSelect, cashRegister, currentUser]);

  // Asegurar que cuando se oculta el select, siempre se tenga la sucursal seleccionada
  useEffect(() => {
    if (!currentUser?.isAdmin && currentUser?.branchId) {
      // Usuario NO administrador: usar su sucursal automáticamente
      setBranchId(currentUser.branchId);
    } else if (shouldHideBranchSelect && branches.length === 1 && !branchId) {
      // Solo asignar automáticamente si hay una sola sucursal
      setBranchId(branches[0].id);
    }
  }, [shouldHideBranchSelect, branches, branchId, currentUser]);

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
      <DialogContent className="sm:max-w-[500px] lg:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              {cashRegister ? t('cashRegisters.edit') : t('cashRegisters.new')}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {cashRegister
                ? t('cashRegisters.editDescription')
                : t('cashRegisters.newDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
            {/* Nombre generado */}
            <div className="space-y-2">
              <Label>{t('cashRegisters.form.name')}</Label>
              <div className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {name}
              </div>
            </div>

            {/* Sucursal */}
            {currentUser !== null && !currentUser.isAdmin && currentUser.branchId ? (
              <div className="space-y-2">
                <Label>{t('form.branch')}</Label>
                <div className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {branches.find(b => b.id === currentUser.branchId)?.name ||
                    (allBranches?.find((b: any) => b.id === currentUser.branchId)?.name) ||
                    t('cashRegisters.form.assignedBranch')}
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                    {t('cashRegisters.form.willUseBranch')}
                  </p>
                </div>
              </div>
            ) : currentUser !== null && currentUser.isAdmin ? (
              branches.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="branchId">{t('form.branch')}</Label>
                  <Select
                    value={branchId || undefined}
                    onValueChange={setBranchId}
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger className="rounded-full w-full">
                      <SelectValue placeholder={t('cashRegisters.form.selectBranch')} />
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
              ) : (
                <div className="space-y-2">
                  <Label>{t('form.branch')}</Label>
                  <div className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {t('cashRegisters.form.noBranchesAvailable')}
                  </div>
                </div>
              )
            ) : currentUser === null ? (
              <div className="space-y-2">
                <Label>{t('form.branch')}</Label>
                <div className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {t('cashRegisters.form.loadingInfo')}
                </div>
              </div>
            ) : null}

            {/* Balance inicial (solo si es nueva caja) */}
            {!cashRegister && (
              <div className="space-y-2">
                <Label htmlFor="openingBalance">{t('cashRegisters.form.initialBalance')}</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder={t('common.placeholders.amount')}
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
              <Label htmlFor="currentDateTime">{t('cashRegisters.form.dateTime')}</Label>
              <Input
                id="currentDateTime"
                value={currentDateTime}
                readOnly
                disabled={isLoading || isLoadingData}
                className="rounded-full"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              className="rounded-full w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('action.cancel')}
            </Button>
            <Button
              type="submit"
              variant="new"
              className="rounded-full w-full sm:w-auto"
              disabled={isLoading || !name.trim()}
            >
              {isLoading
                ? t('message.saving')
                : cashRegister
                  ? t('action.update')
                  : t('action.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

