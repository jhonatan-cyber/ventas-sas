import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SubscriptionsPageClient } from "@/components/admin/subscription/subscriptions-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { prisma } from "@/lib/prisma"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { SubscriptionManagementService } from "@/lib/services/admin/subscription-management-service"
import { AuthService } from "@/lib/services/auth-service"

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  try {
    // Validación de sesión Admin en el servidor
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-auth-token")?.value
    
    if (!token) {
      redirect("/administracion/login")
    }
    
    const payload = await AdminJWTService.verifyToken(token!)
    if (!payload) {
      redirect("/administracion/login")
    }
    
    // Validar acceso de administrador
    const hasAccess = await AuthService.hasAdminAccess(payload.userId)
    if (!hasAccess) {
      redirect("/administracion/login?error=no_access")
    }

    // Verificar permiso específico para listar suscripciones
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'suscripciones_listar')
    if (!canList) {
      redirect("/administracion/dashboard?error=no_permission")
    }

    // Verificar conexión a la base de datos
    await prisma.$connect()

    const result = await SubscriptionManagementService.getAllSubscriptions(0, 1000)
    const subscriptions = result.subscriptions.map((sub: any) => ({
      ...sub,
      customer: sub.organization?.customerOrganizations?.[0]?.customer || null,
      organization: sub.organization,
      plan: {
        ...sub.plan,
        priceMonthly: sub.plan.priceMonthly ? Number(sub.plan.priceMonthly) : null,
        priceYearly: sub.plan.priceYearly ? Number(sub.plan.priceYearly) : null,
      }
    }))

    return <SubscriptionsPageClient initialSubscriptions={subscriptions} />
  } catch (error) {
    console.error("Error loading subscriptions:", error)
    // Si es error de autenticación, redirigir
    if (error instanceof Error && error.message.includes('token')) {
      redirect("/administracion/login")
    }
    return (
      <div className="p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Error de Conexión a la Base de Datos
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            No se pudo conectar a la base de datos. Por favor verifica:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700 dark:text-red-300">
            <li>Que PostgreSQL esté corriendo</li>
            <li>Que el archivo .env exista y tenga la configuración correcta</li>
            <li>Que las credenciales de la base de datos sean correctas</li>
          </ul>
        </div>
      </div>
    )
  }
}

