"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CashRegisterCloseDialog } from "./cash-register-close-dialog";
import { CashRegisterDeleteDialog } from "./cash-register-delete-dialog";
import { CashRegisterDetailsDialog } from "./cash-register-details-dialog";
import { CashRegisterFormDialog } from "./cash-register-form-dialog";
import { CashRegisterOpenDialog } from "./cash-register-open-dialog";
import { CashRegistersContainer } from "./cash-registers-container";
import { CashRegistersHeader } from "./cash-registers-header";

import type { CashRegisterWithRelations } from "./types";

import { useCashRegisterActions } from "@/hooks/sales/cash-register/use-cash-register-actions";
import { useSasPermissions } from "@/contexts/sas-permissions-context";

interface CashRegistersPageClientProps {
  initialCashRegisters: CashRegisterWithRelations[];
  customerSlug: string;
  maxBranches?: number | null;
}

export function CashRegistersPageClient({
  initialCashRegisters,
  customerSlug,
  maxBranches,
}: CashRegistersPageClientProps) {
  // Hook para verificar permisos del usuario
  const { hasPermission } = useSasPermissions();
  
  const [cashRegisters, setCashRegisters] =
    useState<CashRegisterWithRelations[]>(initialCashRegisters);
  const [isLoading, setIsLoading] = useState(false);
  const [detailCashRegister, setDetailCashRegister] =
    useState<CashRegisterWithRelations | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    isAdmin: boolean;
    branchId: string | null;
  } | null>(null);

  // Determinar si mostrar información de sucursal basado en maxBranches
  const shouldShowBranchInfo =
    maxBranches === undefined || maxBranches === null || maxBranches > 1;

  // Cargar información del usuario
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch(`/api/${customerSlug}/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          const isAdmin =
            userData.rol?.nombre?.toLowerCase() === "administrador" ||
            userData.rol?.name?.toLowerCase() === "administrador";
          setCurrentUser({
            isAdmin,
            branchId: userData.sucursalId || userData.branchId || null,
          });
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      }
    };
    loadCurrentUser();
  }, [customerSlug]);

  // Verificar si se debe bloquear el botón de crear caja
  // - Si NO es administrador: se bloquea si su sucursal tiene una caja abierta
  // - Si ES administrador: se bloquea cuando el número de cajas abiertas es igual al número máximo de sucursales del plan
  const shouldBlockCreateButton = useMemo(() => {
    // Si NO es administrador, verificar si su sucursal tiene caja abierta
    if (!currentUser?.isAdmin && currentUser?.branchId) {
      return cashRegisters.some(
        (register) =>
          register.isOpen && register.branchId === currentUser.branchId
      );
    }

    // Si es administrador, verificar límite de sucursales
    if (currentUser?.isAdmin) {
      // Contar cajas abiertas (solo las que tienen sucursal asignada)
      const openCashRegistersWithBranch = cashRegisters.filter(
        (register) => register.isOpen && register.branchId
      );
      const openCashRegistersCount = openCashRegistersWithBranch.length;

      // Si maxBranches es null o undefined, no hay límite, no bloquear
      if (maxBranches === null || maxBranches === undefined) {
        return false;
      }

      // Si el número de cajas abiertas es igual o mayor al máximo de sucursales, bloquear
      if (openCashRegistersCount >= maxBranches) {
        return true;
      }
    }

    return false;
  }, [cashRegisters, currentUser, maxBranches]);

  useEffect(() => {
    setCashRegisters(initialCashRegisters);
  }, [initialCashRegisters]);

  useEffect(() => {
    if (!detailCashRegister) return;
    const updated = cashRegisters.find(
      (register) => register.id === detailCashRegister.id
    );
    if (updated) {
      setDetailCashRegister(updated);
    } else if (isDetailDialogOpen) {
      closeDetailsDialog();
    }
  }, [cashRegisters, detailCashRegister, isDetailDialogOpen]);

  const loadCashRegisters = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/${customerSlug}/cajas?page=1&pageSize=1000`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudieron cargar las cajas");
      }

      const data = await response.json();
      setCashRegisters(
        (data.cashRegisters || []) as CashRegisterWithRelations[]
      );
    } catch (error: any) {
      console.error("Error al cargar cajas:", error);
      toast.error(error.message || "Error al cargar las cajas");
    } finally {
      setIsLoading(false);
    }
  }, [customerSlug]);

  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    isOpenDialogOpen,
    isCloseDialogOpen,
    selectedCashRegister,
    openCreateDialog,
    openDeleteDialog,
    openOpenDialog,
    openCloseDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleOpen,
    handleClose,
  } = useCashRegisterActions(customerSlug, loadCashRegisters);

  const handleCreateClick = () => {
    if (shouldBlockCreateButton) {
      if (currentUser?.isAdmin) {
        // Administrador: mensaje sobre límite de sucursales
        const openCashRegistersCount = cashRegisters.filter(
          (register) => register.isOpen && register.branchId
        ).length;
        toast.info(
          `Ya hay ${openCashRegistersCount} caja(s) abierta(s). El plan permite máximo ${maxBranches} sucursal(es). Cierra una caja antes de crear una nueva.`
        );
      } else {
        // No administrador: mensaje sobre su sucursal
        toast.info(
          "Cierra la caja abierta de tu sucursal antes de crear una nueva."
        );
      }
      return;
    }
    openCreateDialog();
  };

  const openDetailsDialog = (cashRegister: CashRegisterWithRelations) => {
    setDetailCashRegister(cashRegister);
    setIsDetailDialogOpen(true);
  };

  const closeDetailsDialog = () => {
    setIsDetailDialogOpen(false);
    setDetailCashRegister(null);
  };

  const handleOpenDialog = (cashRegister: CashRegisterWithRelations) => {
    openOpenDialog(cashRegister);
  };

  const handleCloseDialog = (cashRegister: CashRegisterWithRelations) => {
    openCloseDialog(cashRegister);
  };

  const _handleDeleteDialog = (cashRegister: CashRegisterWithRelations) => {
    openDeleteDialog(cashRegister);
  };

  // Verificar permisos para mostrar botones de acciones
  // Según la configuración de módulo cajas: crear, listar, ver_detalles, cerrar
  const canCreateCashRegister = hasPermission('cajas_crear');
  const canViewDetailsCashRegister = hasPermission('cajas_ver_detalles');
  const canCloseCashRegister = hasPermission('cajas_cerrar');

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-4 md:px-6">
      {/* Header con título y botón */}
      <CashRegistersHeader
        title="Cajas"
        description="Gestiona las cajas registradoras"
        newButtonText="Nueva Caja"
        onNewClick={canCreateCashRegister ? handleCreateClick : undefined}
        newButtonDisabled={shouldBlockCreateButton || !canCreateCashRegister}
        showNewButton={canCreateCashRegister}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <CashRegistersContainer
        cashRegisters={cashRegisters}
        isLoading={isLoading}
        onViewDetails={canViewDetailsCashRegister ? openDetailsDialog : undefined}
        onOpen={canCreateCashRegister ? handleOpenDialog : undefined} // Usar crear para abrir
        onClose={canCloseCashRegister ? handleCloseDialog : undefined}
        onDelete={undefined} // Cajas no se pueden eliminar según nueva configuración
        maxBranches={maxBranches}
      />

      <CashRegisterDetailsDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog();
          } else {
            setIsDetailDialogOpen(true);
          }
        }}
        cashRegister={detailCashRegister}
        showBranchInfo={shouldShowBranchInfo}
      />

      {/* Modal de crear/editar caja */}
      <CashRegisterFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={
          selectedCashRegister as CashRegisterWithRelations | undefined
        }
        customerSlug={customerSlug}
        onSave={handleSave}
        maxBranches={maxBranches}
        openCashRegisters={cashRegisters.filter(register => register.isOpen)}
      />

      {/* Modal de abrir caja */}
      <CashRegisterOpenDialog
        open={isOpenDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={
          selectedCashRegister as CashRegisterWithRelations | undefined
        }
        onOpen={handleOpen}
      />

      {/* Modal de cerrar caja */}
      <CashRegisterCloseDialog
        open={isCloseDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={
          selectedCashRegister as CashRegisterWithRelations | undefined
        }
        onClose={handleClose}
      />

      {/* Modal de confirmación de eliminar */}
      <CashRegisterDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        cashRegister={
          selectedCashRegister as CashRegisterWithRelations | undefined
        }
        onDelete={handleDelete}
      />
    </div>
  );
}
