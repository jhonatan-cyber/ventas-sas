import { redirect } from "next/navigation"
import { RolesPageClient } from "@/components/admin/role/roles-page-client"
import { RoleAdminService } from "@/lib/services/admin/role-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function RolesPage() {
  // Verificar autenticación de super admin
  const userId = "super-admin-id"
  const profile = await AuthService.getProfileById(userId)
  // Temporalmente desactivamos la validación
  // if (!profile || !profile.isSuperAdmin) {
  //   redirect("/administracion/login")
  // }

  // Obtener roles
  const roles = await RoleAdminService.getAllRoles()

  return <RolesPageClient initialRoles={roles} />
}