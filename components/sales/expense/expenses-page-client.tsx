"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { ExpenseDeleteDialog } from "./expense-delete-dialog"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpensesContainer } from "./expenses-container"
import { ExpensesHeader } from "./expenses-header"
import { ExpenseBranchSummary, SalesExpenseWithRelations } from "./types"

import { useExpenseActions } from "@/hooks/sales/expense/use-expense-actions"

interface ExpensesPageClientProps {
  initialExpenses: SalesExpenseWithRelations[]
  customerSlug: string
  branches: ExpenseBranchSummary[]
  currentUserBranchId?: string | null
  initialIsAdmin?: boolean
}

const normalizeExpense = (expense: any): SalesExpenseWithRelations => ({
  id: expense.id,
  organizationId: expense.organizationId,
  userId: expense.userId,
  branchId: expense.branchId ?? null,
  name: expense.name,
  category: expense.category ?? null,
  description: expense.description,
  amount: Number(expense.amount ?? 0),
  date: typeof expense.date === "string" ? expense.date : new Date(expense.date).toISOString(),
  createdAt: typeof expense.createdAt === "string" ? expense.createdAt : new Date(expense.createdAt).toISOString(),
  updatedAt: typeof expense.updatedAt === "string" ? expense.updatedAt : new Date(expense.updatedAt).toISOString(),
  user: expense.user
    ? {
        id: expense.user.id,
        fullName: expense.user.fullName ?? null,
        email: expense.user.email ?? null,
      }
    : null,
  branch: expense.branch
    ? {
        id: expense.branch.id,
        name: expense.branch.name ?? null,
        address: expense.branch.address ?? null,
      }
    : null,
})

export function ExpensesPageClient({
  initialExpenses,
  customerSlug,
  branches,
  currentUserBranchId = null,
  initialIsAdmin = false,
}: ExpensesPageClientProps) {
  const [expenses, setExpenses] = useState<SalesExpenseWithRelations[]>(() => initialExpenses.map(normalizeExpense))
  const [availableBranches, setAvailableBranches] = useState<ExpenseBranchSummary[]>(branches)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin)
  const [userBranchId, setUserBranchId] = useState<string | null>(currentUserBranchId ?? null)

  useEffect(() => {
    setExpenses(initialExpenses.map(normalizeExpense))
  }, [initialExpenses])

  useEffect(() => {
    setAvailableBranches(branches)
  }, [branches])

  useEffect(() => {
    setUserBranchId(currentUserBranchId ?? null)
  }, [currentUserBranchId])

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/sucursales?page=1&pageSize=1000&status=active`)
      if (!response.ok) return
      const data = await response.json()
      const normalized: ExpenseBranchSummary[] = (data.branches || []).map((branch: any) => ({
        id: branch.id,
        name: branch.name ?? "Sucursal",
        address: branch.address ?? null,
      }))
      setAvailableBranches(normalized)
    } catch (error) {
      console.error("Error al cargar sucursales:", error)
    }
  }, [customerSlug])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    setIsAdmin(initialIsAdmin)
  }, [initialIsAdmin])

  useEffect(() => {
    if (initialIsAdmin && currentUserBranchId !== null) return

    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`/api/${customerSlug}/auth/me`, { cache: "no-store" })
        if (!response.ok) return
        const data = await response.json()

        const roleName = data?.rol?.nombre?.toLowerCase() || ""
        const admin = roleName.includes("administrador") || roleName === "admin"
        setIsAdmin(admin)

        if (data?.sucursalId) {
          setUserBranchId(data.sucursalId)
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error)
      }
    }

    fetchUserInfo()
  }, [customerSlug, initialIsAdmin, currentUserBranchId])

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${customerSlug}/gastos?page=1&pageSize=1000`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudieron cargar los gastos")
      }

      const data = await response.json()
      const normalized = (data.expenses || []).map(normalizeExpense)
      setExpenses(normalized)
    } catch (error: any) {
      console.error("Error al cargar gastos:", error)
      toast.error(error.message || "Error al cargar los gastos")
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug])

  const {
    isFormDialogOpen,
    isDeleteDialogOpen,
    selectedExpense,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
    handleSave,
    handleDelete
  } = useExpenseActions(customerSlug, async () => {
    await loadExpenses()
    await loadBranches()
  })

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      {/* Header con título y botón */}
      <ExpensesHeader
        title="Gestión de Gastos"
        description="Administra los gastos de tu organización"
        newButtonText="Agregar Gasto"
        onNewClick={openCreateDialog}
      />

      {/* Contenedor con filtros, tabla y paginación */}
      <ExpensesContainer 
        expenses={expenses}
        branches={availableBranches}
        isLoading={isLoading}
        isAdmin={isAdmin}
        userBranchId={userBranchId}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      {/* Modal de crear/editar gasto */}
      <ExpenseFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeDialogs}
        expense={selectedExpense}
        branches={availableBranches}
        currentUserBranchId={userBranchId ?? undefined}
        isAdmin={isAdmin}
        onSave={handleSave}
      />

      {/* Modal de confirmación de eliminar */}
      <ExpenseDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDialogs}
        expense={selectedExpense}
        onDelete={handleDelete}
      />
    </div>
  )
}

