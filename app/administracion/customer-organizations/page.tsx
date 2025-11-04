import { redirect } from "next/navigation"
import { CustomerOrganizationsPageClient } from "@/components/admin/customer-organizations/customer-organizations-page-client"
import { CustomerOrganizationService } from "@/lib/services/admin/customer-organization-service"
import { OrganizationAdminService } from "@/lib/services/admin/organization-admin-service"
import { AuthService } from "@/lib/services/auth-service"

export default async function CustomerOrganizationsPage() {
  // Verificar autenticación de super admin
  const userId = "super-admin-id"
  const profile = await AuthService.getProfileById(userId)
  // Temporalmente desactivamos la validación
  // if (!profile || !profile.isSuperAdmin) {
  //   redirect("/administracion/login")
  // }

  // Obtener datos iniciales
  const [customersResult, organizationsResult] = await Promise.all([
    CustomerOrganizationService.getAllCustomersWithOrganizations({
      page: 1,
      pageSize: 100,
    }),
    OrganizationAdminService.getAllOrganizations(),
  ])

  const customers = customersResult.customers.map((customer) => ({
    ...customer,
    organizations: customer.organizations.map((org) => ({
      ...org,
      joinedAt: org.joinedAt.toISOString(),
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

