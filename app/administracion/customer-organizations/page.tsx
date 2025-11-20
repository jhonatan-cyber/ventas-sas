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

  // Obtener datos iniciales con manejo de errores
  let customers: any[] = []
  let organizations: any[] = []

  try {
    const [customersResult, organizationsResult] = await Promise.all([
      CustomerOrganizationService.getAllCustomersWithOrganizations({
        page: 1,
        pageSize: 100,
      }).catch((err) => {
        console.error('Error fetching customers:', err)
        return { customers: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }
      }),
      OrganizationAdminService.getAllOrganizations().catch((err) => {
        console.error('Error fetching organizations:', err)
        return []
      }),
    ])

    customers = (customersResult?.customers || []).map((customer: any) => {
      // El modelo Customer no tiene razonSocial, solo nombre y apellido
      return {
        id: customer.id || '',
        nombre: customer.nombre === null || customer.nombre === undefined ? undefined : String(customer.nombre),
        apellido: customer.apellido === null || customer.apellido === undefined ? undefined : String(customer.apellido),
        email: customer.email === null || customer.email === undefined ? undefined : String(customer.email),
        ci: customer.ci === null || customer.ci === undefined ? undefined : String(customer.ci),
        razonSocial: undefined, // Customer no tiene razonSocial
        organizations: (customer.organizations || []).map((org: any) => {
          try {
            const orgData = org?.organization || {}
            // Filtrar whiteLabelBranding y otros campos no serializables
            return {
              id: String(org.id || ''),
              organizationId: String(org.organizationId || ''),
              isActive: Boolean(org.isActive ?? true),
              joinedAt: org.joinedAt
                ? (org.joinedAt instanceof Date ? org.joinedAt.toISOString() : String(org.joinedAt))
                : new Date().toISOString(),
              organization: {
                id: String(orgData.id || ''),
                name: String(orgData.name || ''),
                razonSocial: orgData.razonSocial === null || orgData.razonSocial === undefined
                  ? undefined
                  : String(orgData.razonSocial),
                nit: orgData.nit === null || orgData.nit === undefined
                  ? undefined
                  : String(orgData.nit),
                address: orgData.address === null || orgData.address === undefined
                  ? undefined
                  : String(orgData.address),
                phone: orgData.phone === null || orgData.phone === undefined
                  ? undefined
                  : String(orgData.phone),
                slug: String(orgData.slug || ''),
                subscriptionStatus: orgData.subscriptionStatus === null || orgData.subscriptionStatus === undefined
                  ? undefined
                  : String(orgData.subscriptionStatus),
              },
            }
          } catch (orgError) {
            console.error('Error mapping organization:', orgError, org)
            return null
          }
        }).filter((org: any): org is NonNullable<typeof org> => org !== null),
      }
    })

    organizations = (organizationsResult || []).map((org: any) => {
      // Asegurar que solo se serialicen campos primitivos
      // Filtrar campos no serializables como _count, subscriptionPlan, etc.
      return {
        id: String(org.id || ''),
        name: String(org.name || ''),
        razonSocial: org.razonSocial === null || org.razonSocial === undefined
          ? undefined
          : String(org.razonSocial),
        nit: org.nit === null || org.nit === undefined
          ? undefined
          : String(org.nit),
        slug: String(org.slug || ''),
        subscriptionStatus: org.subscriptionStatus === null || org.subscriptionStatus === undefined
          ? undefined
          : String(org.subscriptionStatus),
      }
    }).filter((org) => org.id) // Filtrar organizaciones sin ID válido
  } catch (error) {
    console.error('Error loading customer organizations data:', error)
    // En caso de error, retornar arrays vacíos para evitar que la página falle completamente
    customers = []
    organizations = []
  }

  return (
    <CustomerOrganizationsPageClient
      initialCustomers={customers}
      initialOrganizations={organizations}
    />
  )
}

