import { redirect } from "next/navigation"
import { PlansPageClient } from "@/components/admin/plan/plans-page-client"
import { SubscriptionAdminService } from "@/lib/services/admin/subscription-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function PlansPage() {
  // Verificar autenticación de super admin
  const userId = "super-admin-id"
  const profile = await AuthService.getProfileById(userId)
  // Temporalmente desactivamos la validación
  // if (!profile || !profile.isSuperAdmin) {
  //   redirect("/administracion/login")
  // }

  // Obtener planes
  const plans = await SubscriptionAdminService.getAllPlans()

  // Convertir Decimal a número para serialización
  const serializedPlans = plans.map(plan => ({
    ...plan,
    priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
    priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
  }))

  return <PlansPageClient initialPlans={serializedPlans} />
}