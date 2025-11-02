import { redirect } from "next/navigation"
import { CashRegistersPageClient } from "@/components/sales/cash-register/cash-registers-page-client"
import { CashRegisterService } from "@/lib/services/sales/cash-register-service"
import { getOrganizationIdByCustomerSlug, getCustomerBySlug } from "@/lib/utils/organization"

export default async function CashRegistersPage({
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

  // Obtener cajas
  const result = await CashRegisterService.getAllCashRegisters(organizationId, 0, 1000)
  const cashRegisters = result.cashRegisters.map((register) => ({
    ...register,
    openingBalance: Number(register.openingBalance),
    currentBalance: Number(register.currentBalance),
    lastOpenAt: register.lastOpenAt ? register.lastOpenAt.toISOString() : null,
    lastCloseAt: register.lastCloseAt ? register.lastCloseAt.toISOString() : null,
    createdAt: register.createdAt.toISOString(),
    updatedAt: register.updatedAt.toISOString(),
  }))

  return (
    <CashRegistersPageClient 
      initialCashRegisters={cashRegisters} 
      customerSlug={slug}
    />
  )
}

