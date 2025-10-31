import { redirect } from "next/navigation"
import { BranchesPageClient } from "@/components/sales/branch/branches-page-client"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { prisma } from "@/lib/prisma"

export default async function BranchesPage({
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

  // Obtener sucursales
  const branches = await prisma.branch.findMany({
    where: { customerId: customer.id },
    take: 1000,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: {
          id: true,
          razonSocial: true,
          nombre: true,
          apellido: true
        }
      },
      _count: {
        select: {
          usuariosSas: true
        }
      }
    }
  })

  return (
    <BranchesPageClient 
      initialBranches={branches} 
      customerSlug={slug} 
    />
  )
}

