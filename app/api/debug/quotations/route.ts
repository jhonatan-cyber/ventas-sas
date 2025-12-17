import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener todas las cotizaciones con sus relaciones
    const quotations = await prisma.quotation.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Agrupar por organizationId y branchId para análisis
    const byOrganization = new Map<string, number>()
    const byBranch = new Map<string, number>()
    const byOrganizationAndBranch = new Map<string, number>()

    quotations.forEach((q) => {
      // Contar por organización
      const orgCount = byOrganization.get(q.organizationId) || 0
      byOrganization.set(q.organizationId, orgCount + 1)

      // Contar por sucursal
      if (q.branchId) {
        const branchCount = byBranch.get(q.branchId) || 0
        byBranch.set(q.branchId, branchCount + 1)
      }

      // Contar por organización y sucursal
      const key = `${q.organizationId}|${q.branchId || 'null'}`
      const comboCount = byOrganizationAndBranch.get(key) || 0
      byOrganizationAndBranch.set(key, comboCount + 1)
    })

    // Obtener todas las organizaciones para comparar
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    // Obtener todas las sucursales para comparar
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    })

    return NextResponse.json({
      summary: {
        totalQuotations: quotations.length,
        totalOrganizations: organizations.length,
        totalBranches: branches.length,
      },
      quotations: quotations.map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        organizationId: q.organizationId,
        organizationName: q.organization?.name || 'N/A',
        organizationSlug: q.organization?.slug || 'N/A',
        branchId: q.branchId,
        branchName: q.branch?.name || 'N/A',
        customerName: q.customerName,
        status: q.status,
        total: Number(q.total),
        createdAt: q.createdAt.toISOString(),
      })),
      statistics: {
        byOrganization: Array.from(byOrganization.entries()).map(([orgId, count]) => {
          const org = organizations.find((o) => o.id === orgId)
          return {
            organizationId: orgId,
            organizationName: org?.name || 'N/A',
            organizationSlug: org?.slug || 'N/A',
            count,
          }
        }),
        byBranch: Array.from(byBranch.entries()).map(([branchId, count]) => {
          const branch = branches.find((b) => b.id === branchId)
          return {
            branchId,
            branchName: branch?.name || 'N/A',
            organizationId: branch?.organizationId || 'N/A',
            count,
          }
        }),
        byOrganizationAndBranch: Array.from(byOrganizationAndBranch.entries()).map(([key, count]) => {
          const [orgId, branchId] = key.split("|")
          const org = organizations.find((o) => o.id === orgId)
          const branch = branches.find((b) => b.id === branchId)
          return {
            organizationId: orgId,
            organizationName: org?.name || 'N/A',
            organizationSlug: org?.slug || 'N/A',
            branchId: branchId === 'null' ? null : branchId,
            branchName: branch?.name || 'N/A',
            count,
          }
        }),
      },
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        branches: branches.filter((b) => b.organizationId === org.id).map((b) => ({
          id: b.id,
          name: b.name,
        })),
      })),
    })
  } catch (error: any) {
    console.error('Error al consultar cotizaciones:', error)
    return NextResponse.json(
      { error: error.message || 'Error al consultar la base de datos' },
      { status: 500 }
    )
  }
}

