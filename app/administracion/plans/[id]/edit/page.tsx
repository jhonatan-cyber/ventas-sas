import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AuthService } from "@/lib/services/auth-service"
import { PlanForm } from "@/components/admin/plan-form"
import { prisma } from "@/lib/prisma"

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
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

  // Fetch plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
  })

  if (!plan) {
    redirect("/administracion/plans")
  }

  return (
    <AdminLayout>
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Editar Plan</h1>
          <p className="text-muted-foreground">Actualiza la información del plan de suscripción</p>
        </div>

        <PlanForm plan={plan} />
      </main>
    </AdminLayout>
  )
}
