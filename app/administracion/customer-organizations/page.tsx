import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { CustomerOrganizationsPageClient } from "@/components/admin/customer-organizations/customer-organizations-page-client"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { CustomerOrganizationService } from "@/lib/services/admin/customer-organization-service"
import { OrganizationAdminService } from "@/lib/services/admin/organization-admin-service"
import { PermissionCheckService } from "@/lib/services/admin/permission-check-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function CustomerOrganizationsPage() {
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

    // Verificar permiso específico para listar organizaciones
    const canList = await PermissionCheckService.hasActivePermission(payload.userId, 'organizaciones_listar')
    if (!canList) {
      redirect('/administracion/dashboard?error=no_permission')
    }
  } catch {
    redirect('/administracion/login')
  }

  // Obtener datos iniciales
  const [customersResult, organizationsResult] = await Promise.all([
    CustomerOrganizationService.getAllCustomersWithOrganizations({
      page: 1,
      pageSize: 100,
    }),
    OrganizationAdminService.getAllOrganizations(),
  ])

  const customers = customersResult.customers.map((customer: any) => ({
    id: customer.id,
    nombre: customer.nombre === null ? undefined : customer.nombre,
    apellido: customer.apellido === null ? undefined : customer.apellido,
    email: customer.email === null ? undefined : customer.email,
    ci: customer.ci === null ? undefined : customer.ci,
    razonSocial: customer.razonSocial === null ? undefined : customer.razonSocial,
    organizations: (customer.organizations || []).map((org: any) => ({
      id: org.id,
      organizationId: org.organizationId,
      isActive: org.isActive,
      joinedAt: org.joinedAt.toISOString(),
      organization: {
        id: org.organization.id,
        name: org.organization.name,
        razonSocial: org.organization.razonSocial === null ? undefined : org.organization.razonSocial,
        nit: org.organization.nit === null ? undefined : org.organization.nit,
        address: org.organization.address === null ? undefined : org.organization.address, // Usar 'address' en lugar de 'direccion'
        phone: org.organization.phone === null ? undefined : org.organization.phone, // Usar 'phone' en lugar de 'telefono'
        slug: org.organization.slug,
        subscriptionStatus: org.organization.subscriptionStatus === null ? undefined : org.organization.subscriptionStatus,
      },
    })),
  }))

  const organizations = organizationsResult.map((org) => ({
    id: org.id,
    name: org.name,
    razonSocial: (org as any).razonSocial,
    nit: (org as any).nit,
    slug: org.slug,
  }))

  return (
    <CustomerOrganizationsPageClient
      initialCustomers={customers}
      initialOrganizations={organizations}
    />
  )
}

