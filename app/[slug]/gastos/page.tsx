import { redirect } from "next/navigation"
import { ExpensesPageClient } from "@/components/sales/expense/expenses-page-client"
import { ExpenseService } from "@/lib/services/sales/expense-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener gastos
  const result = await ExpenseService.getAllExpenses(organizationId, 0, 1000)
  const expenses = result.expenses

  return (
    <ExpensesPageClient 
      initialExpenses={expenses} 
      customerSlug={slug}
      organizationId={slug}
    />
  )
}

