/**
 * Script para verificar todos los roles activos en la base de datos
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllRoles() {
  try {
    console.log('🔍 Listando todos los roles activos...\n')

    // Buscar todos los roles activos
    const activeRoles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    })

    console.log(`✅ Roles activos encontrados: ${activeRoles.length}\n`)

    if (activeRoles.length > 0) {
      activeRoles.forEach((role, index) => {
        console.log(`${index + 1}. ${role.name}`)
        console.log(`   - Descripción: ${role.description || 'N/A'}`)
        console.log(`   - ID: ${role.id}`)
        console.log(`   - Creado: ${role.createdAt}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No hay roles activos en la base de datos')
    }

    // Buscar roles inactivos
    const inactiveRoles = await prisma.role.findMany({
      where: { isActive: false },
      orderBy: { name: 'asc' },
      select: {
        name: true,
        isActive: true,
      },
    })

    if (inactiveRoles.length > 0) {
      console.log(`\n⚠️  Roles inactivos (${inactiveRoles.length}):`)
      inactiveRoles.forEach((role) => {
        console.log(`   - ${role.name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error al verificar roles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkAllRoles()
  .then(() => {
    console.log('\n✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })

