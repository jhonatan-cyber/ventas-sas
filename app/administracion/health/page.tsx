import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { HealthDashboard } from "@/components/admin/health/health-dashboard"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AuthService } from "@/lib/services/auth-service"

export default async function HealthPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-auth-token")?.value
  if (!token) {
    redirect("/administracion/login")
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect("/administracion/login")
  }

  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect("/administracion/login")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <HealthDashboard />
      </div>
    </AdminLayout>
  )
}
