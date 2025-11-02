"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { SalesExpenseWithRelations, ExpenseBranchSummary } from "./types"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: SalesExpenseWithRelations
  branches: ExpenseBranchSummary[]
  currentUserBranchId?: string | null
  onSave: (data: any) => Promise<void> | void
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
]

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())

export function ExpenseFormDialog({ open, onOpenChange, expense, branches, currentUserBranchId = null, onSave }: ExpenseFormDialogProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [branchId, setBranchId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  const branchOptions = useMemo(() => branches.filter((branch) => Boolean(branch.id)), [branches])

  useEffect(() => {
    if (!open) return

    const today = new Date().toISOString().split("T")[0]
    const singleBranchId = branchOptions.length === 1 ? branchOptions[0]?.id ?? null : null
    const userBranchId = currentUserBranchId ?? null

    if (expense) {
      setName(expense.name || "")
      setCategory(expense.category ?? "")
      setDescription(expense.description || "")
      setAmount(Number(expense.amount ?? 0).toString())
      setDate(expense.date ? expense.date.substring(0, 10) : today)
      const prefilledBranch = expense.branchId
        ?? singleBranchId
        ?? userBranchId
        ?? "all"
      setBranchId(prefilledBranch || "all")
    } else {
      setName("")
      setCategory("")
      setDescription("")
      setAmount("")
      setDate(today)
      const defaultBranch = singleBranchId ?? userBranchId
      if (defaultBranch) {
        setBranchId(defaultBranch)
      } else if (branchOptions.length > 1) {
        setBranchId("all")
      } else {
        setBranchId("all")
      }
    }
  }, [branchOptions, currentUserBranchId, expense, open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = capitalizeWords(name.trim())
    const trimmedDescription = description.trim()
    const numericAmount = parseFloat(amount)

    if (!trimmedName) {
      toast.error("El nombre del gasto es requerido")
      return
    }

    if (!trimmedDescription) {
      toast.error("Describe brevemente el gasto")
      return
    }

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    if (!date) {
      toast.error("Selecciona la fecha del gasto")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        name: trimmedName,
        category: category.trim() || undefined,
        description: trimmedDescription,
        amount: numericAmount,
        date: new Date(date).toISOString(),
        branchId: branchId !== "all" ? branchId : undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
            {expense ? "Editar gasto" : "Registrar gasto"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {expense
              ? "Actualiza la información del gasto registrado"
              : "Completa los datos para registrar un nuevo gasto operativo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expenseName">Nombre del gasto <span className="text-red-500">*</span></Label>
              <Input
                id="expenseName"
                placeholder="Ej. Compra de insumos"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isLoading}
                className="rounded-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expenseCategory">Etiqueta o categoría</Label>
              <div className="flex flex-col gap-3">
                <Input
                  id="expenseCategory"
                  placeholder="Opcional: Servicios, Alquiler, etc."
                  value={category}
                  onChange={(event) => setCategory(capitalizeWords(event.target.value))}
                  disabled={isLoading}
                  className="rounded-full"
                />
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expenseDescription">Descripción <span className="text-red-500">*</span></Label>
              <Textarea
                id="expenseDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe brevemente el gasto, método de pago o cualquier detalle relevante"
                disabled={isLoading}
                rows={4}
                className="rounded-3xl resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expenseDate">Fecha <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="expenseAmount">Monto <span className="text-red-500">*</span></Label>
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

            {branchOptions.length > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="expenseBranch">Sucursal</Label>
                <Select
                  value={branchId}
                  onValueChange={setBranchId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="expenseBranch" className="rounded-full">
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Sin asignar</SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id || ""}>
                        {branch.name || "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
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
                !date
              }
            >
              {isLoading ? "Guardando..." : expense ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

