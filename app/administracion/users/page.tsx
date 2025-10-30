import { redirect } from "next/navigation"
import { UsersPageClient } from "@/components/admin/user/users-page-client"
import { UserAdminService } from "@/lib/services/admin/user-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function UsersPage() {
  // Verificar autenticación de super admin
  const userId = "super-admin-id"
  const profile = await AuthService.getProfileById(userId)
  // Temporalmente desactivamos la validación
  // if (!profile || !profile.isSuperAdmin) {
  //   redirect("/administracion/login")
  // }

  // Obtener usuarios
  const users = await UserAdminService.getAllUsers()

  return <UsersPageClient initialUsers={users} />
}