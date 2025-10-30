import { redirect } from "next/navigation"
import { CustomersPageClient } from "@/components/admin/customer/customers-page-client"
import { CustomerAdminService } from "@/lib/services/admin/customer-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function CustomersPage() {
  // Verificar autenticación de super admin
  const userId = "super-admin-id"
  const profile = await AuthService.getProfileById(userId)
  // Temporalmente desactivamos la validación
  // if (!profile || !profile.isSuperAdmin) {
  //   redirect("/administracion/login")
  // }

  // Obtener clientes
  const result = await CustomerAdminService.getAllCustomers(0, 1000) // Obtener todos los clientes
  const customers = result.customers

  return <CustomersPageClient initialCustomers={customers} />
}
