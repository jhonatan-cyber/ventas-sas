import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { PlanForm } from "@/components/admin/plan-form"

export default async function NewPlanPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is super admin
  const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single()

  if (!profile?.is_super_admin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav isAdmin={true} />

      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Nuevo Plan</h1>
          <p className="text-muted-foreground">Crea un nuevo plan de suscripción</p>
        </div>

        <PlanForm />
      </main>
    </div>
  )
}
