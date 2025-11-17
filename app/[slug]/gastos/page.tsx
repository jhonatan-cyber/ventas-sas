import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ExpensesPageClient } from "@/components/sales/expense/expenses-page-client"
import { AuthSasService } from "@/lib/services/sales/auth-sas-service"
import { BranchService } from "@/lib/services/sales/branch-service"
import { ExpenseService } from "@/lib/services/sales/expense-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug, getMaxBranchesBySlug } from "@/lib/utils/organization"

const serializeExpense = (expense: any) => ({
  id: expense.id,
  organizationId: expense.organizationId,
  userId: expense.userId,
  branchId: expense.branchId ?? null,
  name: expense.name,
  category: expense.category ?? null,
  description: expense.description,
  amount: Number(expense.amount ?? 0),
  date: expense.date ? expense.date.toISOString() : new Date().toISOString(),
  createdAt: expense.createdAt ? expense.createdAt.toISOString() : new Date().toISOString(),
  updatedAt: expense.updatedAt ? expense.updatedAt.toISOString() : new Date().toISOString(),
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

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/login`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)

  const cookieStore = await cookies()
  const token = cookieStore.get('sas-auth-token')?.value
  const currentUser = token ? await AuthSasService.verifyToken(slug, token) : null
  const currentUserBranchId = currentUser?.sucursalId || currentUser?.sucursal?.id || null
  const roleName = currentUser?.rol?.nombre?.toLowerCase() || ""
  const isAdmin =
    roleName.includes("administrador") ||
    roleName === "admin"

  // Obtener gastos - Si no hay organizationId, usar array vacío en lugar de redirigir
  const expenses = organizationId
    ? (await ExpenseService.getAllExpenses(organizationId, 0, 1000)).expenses.map(serializeExpense)
    : []

  const branches = organizationId
    ? await BranchService.getActiveBranches(organizationId)
    : []

  const serializedBranches = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    address: branch.address ?? null,
  }))

  // Obtener límite de sucursales del plan
  const maxBranches = await getMaxBranchesBySlug(slug)

  return (
    <ExpensesPageClient 
      initialExpenses={expenses} 
      customerSlug={slug}
      currentUserBranchId={currentUserBranchId}
      branches={serializedBranches}
      initialIsAdmin={isAdmin}
      maxBranches={maxBranches}
    />
  )
}

