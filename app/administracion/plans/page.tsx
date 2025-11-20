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

    // Convertir Decimal a número y asegurar que modules sea un array para serialización
    const serializedPlans = plans.map(plan => {
      // Asegurar que modules sea un array válido
      let modules: string[] = []
      if (plan.modules) {
        try {
          // Si modules es un string JSON, parsearlo
          if (typeof plan.modules === 'string') {
            const parsed = JSON.parse(plan.modules)
            modules = Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === 'string') : []
          } 
          // Si ya es un array, convertirlo a string[] filtrando valores no string
          else if (Array.isArray(plan.modules)) {
            modules = plan.modules.filter((m): m is string => typeof m === 'string')
          }
          // Si es un objeto, intentar convertirlo
          else if (typeof plan.modules === 'object' && plan.modules !== null) {
            modules = Object.values(plan.modules).filter((m): m is string => typeof m === 'string')
          }
        } catch {
          // Si hay error al parsear, usar array vacío
          modules = []
        }
      }

      return {
        ...plan,
        priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
        modules: modules.length > 0 ? modules : null,
      }
    })

    return <PlansPageClient initialPlans={serializedPlans} />
  } catch  {
    redirect('/administracion/login')
  }
}