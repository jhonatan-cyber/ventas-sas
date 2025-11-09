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

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: SalesExpenseWithRelations;
  branches: ExpenseBranchSummary[];
  currentUserBranchId?: string | null;
  isAdmin?: boolean;
  onSave: (data: any) => Promise<void> | void;
}

const CATEGORY_SUGGESTIONS = [
  "Servicios",
  "Insumos",
  "Transporte",
  "Salarios",
  "Alquiler",
  "Servicios Públicos",
  "Marketing",
  "Mantenimiento",
  "Impuestos",
  "Otros",
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
  onSave,
}: ExpenseFormDialogProps) {
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
  const adminCanSelectBranch = isAdminUser && hasSelectableBranches;

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

    if (expense) {
      setName(expense.name || "");
      setCategory(expense.category ?? "");
      setDescription(expense.description || "");
      setAmount(Number(expense.amount ?? 0).toString());
      setDate(expense.date ? expense.date.substring(0, 10) : today);

      const prefilledBranch = isAdminUser
        ? expense.branchId ?? singleBranchId ?? userBranchId ?? "all"
        : userBranchId ?? expense.branchId ?? singleBranchId ?? "all";

      setBranchId(prefilledBranch || "all");
    } else {
      setName("");
      setCategory("");
      setDescription("");
      setAmount("");
      setDate(today);
      const defaultBranch = isAdminUser
        ? "all"
        : userBranchId ?? singleBranchId ?? "all";

      setBranchId(defaultBranch || "all");
    }
  }, [selectableBranches, currentUserBranchId, expense, isAdminUser, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formattedName = capitalizeSentence(name.trim());
    const formattedDescription = capitalizeSentence(description.trim());
    const numericAmount = parseFloat(amount);

    if (!formattedName) {
      toast.error("El nombre del gasto es requerido");
      return;
    }

    if (!formattedDescription) {
      toast.error("Describe brevemente el gasto");
      return;
    }

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (!date) {
      toast.error("Selecciona la fecha del gasto");
      return;
    }

    if (adminCanSelectBranch && (!branchId || branchId === "all")) {
      toast.error("Selecciona la sucursal del gasto");
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

    console.log("Enviando gasto", payload);

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
              {expense ? "Editar gasto" : "Registrar gasto"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {expense
                ? "Actualiza la información del gasto registrado"
                : "Completa los datos para registrar un nuevo gasto operativo"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-white dark:bg-[#111111]">
            <div className="grid gap-2">
              <Label htmlFor="expenseName">
                Nombre del gasto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expenseName"
                placeholder="Ej. Compra de insumos"
                value={name}
                onChange={(event) =>
                  setName(capitalizeSentence(event.target.value))
                }
                disabled={isLoading}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <div className={`flex gap-4 ${adminCanSelectBranch ? "" : ""}`}>
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="expenseCategory" className="text-sm font-medium">
                    Etiqueta o categoría
                  </Label>
                  <Input
                    id="expenseCategory"
                    placeholder="Opcional: Servicios, Alquiler, etc."
                    value={category}
                    onChange={(event) =>
                      setCategory(capitalizeWords(event.target.value))
                    }
                    disabled={isLoading}
                    className="rounded-full"
                  />
                </div>

                {adminCanSelectBranch && (
                  <div className="w-[220px] flex flex-col gap-2">
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
                            {branch.name || "Sin nombre"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORY_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      category === suggestion
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setCategory(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
                placeholder="Describe brevemente el gasto, método de pago o cualquier detalle relevante"
                disabled={isLoading}
                rows={4}
                className="rounded-3xl resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expenseDate">
                  Fecha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={isLoading}
                  className="rounded-full"
                />
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

          <DialogFooter className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-[#2a2a2a] dark:bg-[#111111] sm:flex-row sm:justify-center">
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
              {isLoading ? "Agregando..." : expense ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}