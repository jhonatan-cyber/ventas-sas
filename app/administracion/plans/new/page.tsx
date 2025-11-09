import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AuthService } from "@/lib/services/auth-service"
import { PlanForm } from "@/components/admin/plan-form"

export default async function NewPlanPage() {
  // Validación de sesión Admin en el servidor
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-auth-token')?.value
  if (!token) {
    redirect('/administracion/login')
  }
  const payload = await AdminJWTService.verifyToken(token!)
  if (!payload) {
    redirect('/administracion/login')
  }
  
  // Validar acceso de administrador (super admin o rol Administrador)
  const hasAccess = await AuthService.hasAdminAccess(payload.userId)
  if (!hasAccess) {
    redirect('/administracion/login')
  }

  return (
    <AdminLayout>
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Nuevo Plan</h1>
          <p className="text-muted-foreground">Crea un nuevo plan de suscripción</p>
        </div>

        <PlanForm />
      </main>
    </AdminLayout>
  )
}
