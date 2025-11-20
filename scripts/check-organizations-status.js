import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subscriptionStatus: true
      }
    })
    
    console.log('Organizaciones:')
    orgs.forEach(org => {
      console.log(`- ${org.name}: ${org.subscriptionStatus}`)
    })
    
    const active = orgs.filter(o => o.subscriptionStatus === 'active').length
    const trial = orgs.filter(o => o.subscriptionStatus === 'trial').length
    const suspended = orgs.filter(o => o.subscriptionStatus === 'suspended').length
    
    console.log(`\nResumen:`)
    console.log(`- Total: ${orgs.length}`)
    console.log(`- Active: ${active}`)
    console.log(`- Trial: ${trial}`)
    console.log(`- Suspended: ${suspended}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

