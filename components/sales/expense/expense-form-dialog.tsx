"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SalesExpenseWithRelations, ExpenseBranchSummary } from "./types";

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
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDateWithPreferences } from "@/lib/utils/preferences";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: SalesExpenseWithRelations;
  branches: ExpenseBranchSummary[];
  currentUserBranchId?: string | null;
  isAdmin?: boolean;
  maxBranches?: number | null;
  customerSlug: string;
  onSave: (data: any) => Promise<void> | void;
}

// Las sugerencias de categorías se traducen dinámicamente usando "*"
const CATEGORY_SUGGESTIONS = [
  "services",
  "supplies",
  "transport",
  "salaries",
  "rent",
  "utilities",
  "marketing",
  "maintenance",
  "taxes",
  "other",
];

const capitalizeWords = (value: string) =>
  value.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

const capitalizeSentence = (value: string) => {
  if (!value) return "";
  const matchIndex = value.search(/\p{L}/u);
  if (matchIndex === -1) return value;

  return (
    value.slice(0, matchIndex) +
    value.charAt(matchIndex).toUpperCase() +
    value.slice(matchIndex + 1)
  );
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  branches,
  currentUserBranchId = null,
  isAdmin = false,
  maxBranches,
  customerSlug,
  onSave,
}: ExpenseFormDialogProps) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [branchId, setBranchId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSelectableBranches, setHasSelectableBranches] = useState(
    () => (isAdmin ? true : Boolean(branches?.some((branch) => Boolean(branch.id))))
  );

  const branchOptions = useMemo(() => branches ?? [], [branches]);
  const selectableBranches = useMemo(
    () => branchOptions.filter((branch) => Boolean(branch.id)),
    [branchOptions]
  );
  const isAdminUser = Boolean(isAdmin);
  // Ocultar select de sucursal si el plan solo permite una y solo hay una disponible
  const shouldHideBranchSelect = maxBranches === 1 && selectableBranches.length === 1;
  const adminCanSelectBranch = isAdminUser && hasSelectableBranches && !shouldHideBranchSelect;

  useEffect(() => {
    if (selectableBranches.length > 0) {
      setHasSelectableBranches(true);
    }
  }, [selectableBranches.length]);

  useEffect(() => {
    if (isAdminUser) {
      setHasSelectableBranches(true);
    }
  }, [isAdminUser]);

  useEffect(() => {
    if (!open) return;

    const today = new Date().toISOString().split("T")[0];
    const singleBranchId =
      selectableBranches.length === 1
        ? selectableBranches[0]?.id ?? null
        : null;
    const userBranchId = currentUserBranchId ?? null;

    // Si el plan solo permite una sucursal y solo hay una disponible, seleccionarla automáticamente
    const autoSelectBranchId = shouldHideBranchSelect ? singleBranchId : null;

    if (expense) {
      setName(expense.name || "");
      setCategory(expense.category ?? "");
      setDescription(expense.description || "");
      setAmount(Number(expense.amount ?? 0).toString());
      setDate(expense.date ? expense.date.substring(0, 10) : today);

      const prefilledBranch = isAdminUser
        ? expense.branchId ?? autoSelectBranchId ?? singleBranchId ?? userBranchId ?? "all"
        : userBranchId ?? expense.branchId ?? autoSelectBranchId ?? singleBranchId ?? "all";

      setBranchId(prefilledBranch || "all");
    } else {
      setName("");
      setCategory("");
      setDescription("");
      setAmount("");
      setDate("");
      const defaultBranch = isAdminUser
        ? autoSelectBranchId ?? "all"
        : userBranchId ?? autoSelectBranchId ?? singleBranchId ?? "all";

      setBranchId(defaultBranch || "all");
    }
  }, [selectableBranches, currentUserBranchId, expense, isAdminUser, open, shouldHideBranchSelect]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formattedName = capitalizeSentence(name.trim());
    const formattedDescription = capitalizeSentence(description.trim());
    const numericAmount = parseFloat(amount);

    if (!formattedName) {
      toast.error('El nombre del gasto es requerido');
      return;
    }

    if (!formattedDescription) {
      toast.error('La descripción del gasto es requerida');
      return;
    }

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    if (!date || date.trim() === "") {
      toast.error('La fecha es requerida');
      return;
    }

    // Solo validar sucursal si el select está visible y es requerido
    if (adminCanSelectBranch && (!branchId || branchId === "all")) {
      toast.error('Debe seleccionar una sucursal');
      return;
    }

    const resolvedBranchId = isAdminUser
      ? branchId !== "all"
        ? branchId
        : undefined
      : currentUserBranchId ?? (branchId !== "all" ? branchId : undefined);

    const payload = {
      name: formattedName,
      category: category.trim() || undefined,
      description: formattedDescription,
      amount: numericAmount,
      date: new Date(date).toISOString(),
      branchId: resolvedBranchId || undefined,
    };

    setIsLoading(true);
    try {
      await onSave({
        ...payload,
      });
      setName(formattedName);
      setDescription(formattedDescription);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] flex flex-col overflow-hidden p-0 rounded-2xl">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {expense
                ? 'Modifica la información del gasto'
                : 'Registra un nuevo gasto del negocio'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-white dark:bg-[#111111]">
            <div className="grid gap-2">
              <Label htmlFor="expenseName">
                Nombre del Gasto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expenseName"
                placeholder="Ej: Compra de materiales"
                value={name}
                onChange={(event) =>
                  setName(capitalizeSentence(event.target.value))
                }
                disabled={isLoading}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="expenseCategory" className="text-sm font-medium">
                    Categoría
                  </Label>
                  <Input
                    id="expenseCategory"
                    placeholder="Ej: Servicios, Insumos"
                    value={category}
                    onChange={(event) =>
                      setCategory(capitalizeWords(event.target.value))
                    }
                    disabled={isLoading}
                    className="rounded-full"
                  />
                </div>

                {adminCanSelectBranch && (
                  <div className="hidden sm:flex w-[220px] flex-col gap-2">
                    <Label htmlFor="expenseBranch" className="text-sm font-medium">
                      Sucursal
                    </Label>
                    <Select
                      value={branchId}
                      onValueChange={setBranchId}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="expenseBranch" className="rounded-full w-full">
                        <SelectValue placeholder="Seleccionar sucursal" className="text-start" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="all">Seleccionar sucursal</SelectItem>
                        {selectableBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id || ""}>
                            {branch.name || 'Sin nombre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORY_SUGGESTIONS.map((suggestion) => {
                  // Mapear las claves a los valores originales para comparación
                  const originalValues: Record<string, string> = {
                    services: "Servicios",
                    supplies: "Insumos",
                    transport: "Transporte",
                    salaries: "Salarios",
                    rent: "Alquiler",
                    utilities: "Servicios Públicos",
                    marketing: "Marketing",
                    maintenance: "Mantenimiento",
                    taxes: "Impuestos",
                    other: "Otros",
                  };
                  const originalValue = originalValues[suggestion] || suggestion;
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        category === originalValue
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setCategory(originalValue)}
                      disabled={isLoading}
                    >
                      {originalValue}
                    </button>
                  );
                })}
              </div>

              {/* Select de sucursal en móvil - debajo de las etiquetas */}
              {adminCanSelectBranch && (
                <div className="flex flex-col gap-2 sm:hidden">
                  <Label htmlFor="expenseBranchMobile" className="text-sm font-medium">
                    Sucursal
                  </Label>
                  <Select
                    value={branchId}
                    onValueChange={setBranchId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="expenseBranchMobile" className="rounded-full w-full">
                      <SelectValue placeholder="Seleccionar sucursal" className="text-start" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">Seleccionar sucursal</SelectItem>
                      {selectableBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id || ""}>
                          {branch.name || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expenseDescription">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="expenseDescription"
                value={description}
                onChange={(event) =>
                  setDescription(capitalizeSentence(event.target.value))
                }
                placeholder="Describe el gasto realizado..."
                disabled={isLoading}
                rows={4}
                className="rounded-lg resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expenseDate">
                  Fecha <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="expenseDate"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "w-full rounded-full",
                      // En móviles: ocultar el indicador y los campos de fecha nativos
                      isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:opacity-0 [&::-webkit-datetime-edit-text]:opacity-0 [&::-webkit-datetime-edit-month-field]:opacity-0 [&::-webkit-datetime-edit-day-field]:opacity-0 [&::-webkit-datetime-edit-year-field]:opacity-0 [&::-webkit-inner-spin-button]:opacity-0 [&::-webkit-outer-spin-button]:opacity-0",
                      // En PC: mostrar todo normalmente
                      !isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                    )}
                    style={date && isMobile ? { color: 'transparent', caretColor: 'transparent' } : undefined}
                  />
                  {!date && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                      <span className="text-sm text-gray-400">dd/mm/aaa</span>
                    </div>
                  )}
                  {date && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {(() => {
                          const [year, month, day] = date.split("-").map(Number)
                          const localDate = new Date(year, month - 1, day)
                          return formatDateWithPreferences(localDate, customerSlug)
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expenseAmount">
                  Monto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            {!adminCanSelectBranch && currentUserBranchId && (
              <input type="hidden" value={currentUserBranchId} />
            )}
          </div>

          <DialogFooter className="sticky bottom-0 flex flex-col sm:flex-row gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-[#2a2a2a] dark:bg-[#111111] sm:justify-center items-stretch sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-full w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="new"
              className="rounded-full w-full sm:w-auto"
              disabled={
                isLoading ||
                !name.trim() ||
                !description.trim() ||
                !amount ||
                Number.isNaN(parseFloat(amount)) ||
                parseFloat(amount) <= 0 ||
                !date ||
                (adminCanSelectBranch && (!branchId || branchId === "all"))
              }
            >
              {isLoading ? 'Guardando...' : expense ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}