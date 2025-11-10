import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { CustomersPageClient } from "@/components/admin/customer/customers-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { CustomerAdminService } from "@/lib/services/admin/customer-admin-service"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function CustomersPage() {
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

    // Verificar permiso específico para listar clientes
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'clientes_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }

    // Obtener clientes
    const result = await CustomerAdminService.getAllCustomers(0, 1000) // Obtener todos los clientes
    const customers = result.customers.filter((customer): customer is NonNullable<typeof customer> => customer !== null)

    return <CustomersPageClient initialCustomers={customers} />
  } catch (error) {
    redirect('/administracion/login')
  }
}
