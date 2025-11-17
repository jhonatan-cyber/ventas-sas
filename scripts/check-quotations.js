import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkQuotations() {
  try {
    console.log('🔍 Consultando cotizaciones en la base de datos...\n')

    // Obtener todas las cotizaciones
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
            organizationId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📊 Total de cotizaciones: ${quotations.length}\n`)

    if (quotations.length === 0) {
      console.log('⚠️  No hay cotizaciones en la base de datos')
      return
    }

    // Agrupar por organización
    const byOrg = new Map()
    quotations.forEach((q) => {
      const key = q.organizationId
      const count = byOrg.get(key) || 0
      byOrg.set(key, count + 1)
    })

    // Agrupar por sucursal
    const byBranch = new Map()
    quotations.forEach((q) => {
      if (q.branchId) {
        const key = q.branchId
        const count = byBranch.get(key) || 0
        byBranch.set(key, count + 1)
      }
    })

    // Obtener organizaciones
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    // Obtener sucursales
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    })

    console.log('📋 RESUMEN POR ORGANIZACIÓN:')
    console.log('='.repeat(80))
    byOrg.forEach((count, orgId) => {
      const org = organizations.find((o) => o.id === orgId)
      console.log(`\n  Organización: ${org?.name || 'N/A'} (${org?.slug || 'N/A'})`)
      console.log(`  ID: ${orgId}`)
      console.log(`  Cotizaciones: ${count}`)
      
      // Mostrar sucursales de esta organización
      const orgBranches = branches.filter((b) => b.organizationId === orgId)
      if (orgBranches.length > 0) {
        console.log(`  Sucursales (${orgBranches.length}):`)
        orgBranches.forEach((branch) => {
          const branchQuotations = quotations.filter((q) => q.branchId === branch.id && q.organizationId === orgId)
          console.log(`    - ${branch.name} (ID: ${branch.id}) - ${branchQuotations.length} cotizaciones`)
        })
      }
    })

    console.log('\n\n📋 DETALLE DE COTIZACIONES:')
    console.log('='.repeat(80))
    quotations.forEach((q, index) => {
      console.log(`\n${index + 1}. Cotización: ${q.quotationNumber}`)
      console.log(`   ID: ${q.id}`)
      console.log(`   Organización ID: ${q.organizationId} (${q.organization?.name || 'N/A'})`)
      console.log(`   Sucursal ID: ${q.branchId || 'null'} (${q.branch?.name || 'N/A'})`)
      console.log(`   Cliente: ${q.customerName || 'N/A'}`)
      console.log(`   Estado: ${q.status}`)
      console.log(`   Total: ${Number(q.total)}`)
      console.log(`   Creada: ${q.createdAt.toISOString()}`)
      
      // Verificar si la sucursal pertenece a la organización
      if (q.branchId && q.branch) {
        if (q.branch.organizationId !== q.organizationId) {
          console.log(`   ⚠️  ADVERTENCIA: La sucursal pertenece a otra organización!`)
          console.log(`      Sucursal organizationId: ${q.branch.organizationId}`)
          console.log(`      Cotización organizationId: ${q.organizationId}`)
        }
      }
    })

    console.log('\n\n📊 ESTADÍSTICAS:')
    console.log('='.repeat(80))
    console.log(`Total de cotizaciones: ${quotations.length}`)
    console.log(`Total de organizaciones: ${organizations.length}`)
    console.log(`Total de sucursales: ${branches.length}`)
    console.log(`Cotizaciones con sucursal: ${quotations.filter((q) => q.branchId).length}`)
    console.log(`Cotizaciones sin sucursal: ${quotations.filter((q) => !q.branchId).length}`)

    // Verificar inconsistencias
    const inconsistencies = quotations.filter((q) => {
      if (!q.branchId) return false
      if (!q.branch) return false
      return q.branch.organizationId !== q.organizationId
    })

    if (inconsistencies.length > 0) {
      console.log(`\n⚠️  INCONSISTENCIAS ENCONTRADAS: ${inconsistencies.length}`)
      inconsistencies.forEach((q) => {
        console.log(`  - ${q.quotationNumber}: La sucursal ${q.branch?.name} no pertenece a la organización ${q.organization?.name}`)
      })
    } else {
      console.log('\n✅ No se encontraron inconsistencias')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkQuotations()

