import { redirect } from "next/navigation"

import { UsuariosSasPageClient } from "@/components/sales/usuario/usuarios-sas-page-client"
import { prisma } from "@/lib/prisma"
import { RoleSasService } from "@/lib/services/sales/role-sas-service"
import { UsuarioSasService } from "@/lib/services/sales/usuario-sas-service"
import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

export default async function UsuariosPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Obtener organizationId desde el slug
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    redirect(`/${slug}/dashboard`)
  }

  // Obtener usuarios y roles
  const [usuariosResult, rolesResult] = await Promise.all([
    UsuarioSasService.getAllUsuarios(organizationId, 0, 1000),
    RoleSasService.getActiveRolesByOrganization(organizationId)
  ])

  // Obtener sucursales activas
  const sucursales = await prisma.branch.findMany({
    where: { 
      organizationId, 
      isActive: true 
    },
    select: { id: true, name: true },
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

