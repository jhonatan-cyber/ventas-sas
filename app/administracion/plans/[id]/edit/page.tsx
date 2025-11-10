import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { PlanForm, PlanFormValues } from "@/components/admin/plan/plan-form"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { prisma } from "@/lib/prisma"
import { AuthService } from "@/lib/services/auth-service"

const toStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null
  }
  return value.map((item) => String(item))
}

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get("admin-auth-token")?.value
  if (!token) {
    redirect("/administracion/login")
  }
  const payload = await AdminJWTService.verifyToken(token)
  if (!payload) {
    redirect("/administracion/login")
  }

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect("/administracion/login")
  }

  const planRecord = await prisma.subscriptionPlan.findUnique({
    where: { id },
  })

  if (!planRecord) {
    redirect("/administracion/plans")
  }

  const plan: PlanFormValues = {
    id: planRecord.id,
    name: planRecord.name,
    description: planRecord.description,
    hasMonthly: planRecord.hasMonthly,
    hasYearly: planRecord.hasYearly,
    priceMonthly: planRecord.priceMonthly?.toNumber?.() ?? null,
    priceYearly: planRecord.priceYearly?.toNumber?.() ?? null,
    maxUsers: planRecord.maxUsers,
    maxProducts: planRecord.maxProducts,
    maxBranches: planRecord.maxBranches,
    modules: toStringArray(planRecord.modules),
    features: toStringArray(planRecord.features),
    isActive: planRecord.isActive,
  }

  return (
    <AdminLayout>
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Editar Plan</h1>
          <p className="text-muted-foreground">
            Actualiza la información del plan de suscripción
          </p>
        </div>

        <PlanForm plan={plan} />
      </main>
    </AdminLayout>
  )
}
