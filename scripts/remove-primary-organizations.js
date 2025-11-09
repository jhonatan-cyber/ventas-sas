const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Eliminando marcas de organización principal...')
  
  const result = await prisma.customerOrganization.updateMany({
    where: {
      isPrimary: true
    },
    data: {
      isPrimary: false
    }
  })

  console.log(`✅ Actualizados ${result.count} registros`)
  console.log('✅ Todas las organizaciones ahora tienen isPrimary = false')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📝 Los clientes ahora pueden tener múltiples empresas sin una principal')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

