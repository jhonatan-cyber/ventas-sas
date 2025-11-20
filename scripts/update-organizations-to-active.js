import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Actualizando organizaciones de trial a active...')

    // Actualizar todas las organizaciones con estado trial a active
    const result = await prisma.organization.updateMany({
      where: {
        subscriptionStatus: 'trial'
      },
      data: {
        subscriptionStatus: 'active'
      }
    })

    console.log(`✅ ${result.count} organizaciones actualizadas de trial a active`)
    console.log('✨ Actualización completada exitosamente!')
  } catch (error) {
    console.error('❌ Error al actualizar organizaciones:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

