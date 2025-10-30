import { redirect } from "next/navigation"
import { UsuariosSasPageClient } from "@/components/sales/usuario/usuarios-sas-page-client"
import { UsuarioSasService } from "@/lib/services/sales/usuario-sas-service"
import { RoleSasService } from "@/lib/services/sales/role-sas-service"
import { getCustomerBySlug, getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"
import { prisma } from "@/lib/prisma"

export default async function UsuariosPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  if (!customer) {
    redirect(`/${slug}/dashboard`)
  }

  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener usuarios y roles
  const [usuariosResult, rolesResult] = await Promise.all([
    UsuarioSasService.getAllUsuarios(customer.id, 0, 1000),
    RoleSasService.getActiveRolesByCustomer(customer.id)
  ])

  // Obtener sucursales activas
  const sucursales = await prisma.branch.findMany({
    where: {
      organizationId,
      isActive: true
    },
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <UsuariosSasPageClient 
      initialUsuarios={usuariosResult.usuarios} 
      roles={rolesResult}
      sucursales={sucursales}
      customerSlug={slug} 
    />
  )
}

