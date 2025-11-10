import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { PlansPageClient } from "@/components/admin/plan/plans-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { SubscriptionAdminService } from "@/lib/services/admin/subscription-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function PlansPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  
  if (!token) {
    redirect('/administracion/login')
  }
  
  try {
    const payload = await AdminJWTService.verifyToken(token!)
    if (!payload) {
      redirect('/administracion/login')
    }
    
    // Validar acceso de administrador
    const hasAccess = await AuthService.hasAdminAccess(payload.userId)
    if (!hasAccess) {
      redirect('/administracion/login?error=no_access')
    }

    // Verificar permiso específico para listar planes
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'planes_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }

    // Obtener planes
    const plans = await SubscriptionAdminService.getAllPlans()

    // Convertir Decimal a número para serialización
    const serializedPlans = plans.map(plan => ({
      ...plan,
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
    }))

    return <PlansPageClient initialPlans={serializedPlans} />
  } catch (error) {
    redirect('/administracion/login')
  }
}