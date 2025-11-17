import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOrganization() {
  try {
    const slug = 'nuwesoft'
    
    console.log(`🔍 Verificando organización con slug: ${slug}\n`)

    // Buscar organización por slug
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        customerOrganizations: {
          where: {
            isActive: true
          },
          include: {
            customer: true
          }
        }
      }
    })

    if (!organization) {
      console.log('❌ No se encontró la organización')
      return
    }

    console.log('📋 INFORMACIÓN DE LA ORGANIZACIÓN:')
    console.log('='.repeat(80))
    console.log(`ID: ${organization.id}`)
    console.log(`Nombre: ${organization.name}`)
    console.log(`Slug: ${organization.slug}`)
    console.log(`Relaciones con clientes: ${organization.customerOrganizations.length}`)

    // Verificar suscripciones
    const subscriptions = await prisma.subscription.findMany({
      where: {
        organizationId: organization.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📋 SUSCRIPCIONES (${subscriptions.length}):`)
    console.log('='.repeat(80))
    if (subscriptions.length === 0) {
      console.log('⚠️  No hay suscripciones registradas')
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n${index + 1}. Suscripción:`)
        console.log(`   ID: ${sub.id}`)
        console.log(`   Estado: ${sub.status}`)
        console.log(`   Fecha inicio: ${sub.startDate?.toISOString() || 'N/A'}`)
        console.log(`   Fecha fin: ${sub.endDate?.toISOString() || 'N/A'}`)
        const now = new Date()
        const isActive = sub.status === 'active' || sub.status === 'trial'
        const isNotExpired = !sub.endDate || new Date(sub.endDate) > now
        const isValid = isActive && isNotExpired
        console.log(`   Válida: ${isValid ? '✅' : '❌'}`)
      })
    }

    // Verificar si getOrganizationBySlug retornaría esta organización
    const activeCustomerOrgs = organization.customerOrganizations.filter(
      co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
    )

    console.log(`\n📋 RELACIONES CON CLIENTES ACTIVAS: ${activeCustomerOrgs.length}`)
    if (activeCustomerOrgs.length === 0) {
      console.log('⚠️  No hay relaciones activas con clientes')
    }

    const activeSubscription = subscriptions.find(sub => {
      const isActive = sub.status === 'active' || sub.status === 'trial'
      const isNotExpired = !sub.endDate || new Date(sub.endDate) > new Date()
      return isActive && isNotExpired
    })

    console.log(`\n📋 RESULTADO DE VALIDACIÓN:`)
    console.log('='.repeat(80))
    console.log(`Tiene relaciones activas: ${activeCustomerOrgs.length > 0 ? '✅' : '❌'}`)
    console.log(`Tiene suscripción activa: ${activeSubscription ? '✅' : '❌'}`)
    
    if (activeSubscription) {
      console.log(`   Suscripción ID: ${activeSubscription.id}`)
      console.log(`   Estado: ${activeSubscription.status}`)
    }

    const wouldReturn = activeCustomerOrgs.length > 0 && activeSubscription !== undefined
    console.log(`\ngetOrganizationBySlug retornaría: ${wouldReturn ? '✅ Organización' : '❌ null'}`)

    // Verificar cotizaciones
    const quotations = await prisma.quotation.findMany({
      where: {
        organizationId: organization.id
      }
    })

    console.log(`\n📋 COTIZACIONES EN ESTA ORGANIZACIÓN: ${quotations.length}`)
    if (quotations.length > 0) {
      quotations.forEach((q, index) => {
        console.log(`\n${index + 1}. ${q.quotationNumber}`)
        console.log(`   ID: ${q.id}`)
        console.log(`   BranchId: ${q.branchId || 'null'}`)
        console.log(`   OrganizationId: ${q.organizationId}`)
        console.log(`   Match: ${q.organizationId === organization.id ? '✅' : '❌'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrganization()

