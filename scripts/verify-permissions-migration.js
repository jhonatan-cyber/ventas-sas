/**
 * Script para verificar que la migración de permisos se completó correctamente
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyMigration() {
  try {
    console.log('🔍 Verificando migración de permisos...\n')

    // Verificar que la tabla existe
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_permissions'
      ) as exists;
    `)

    if (!tableExists[0]?.exists) {
      console.error('❌ La tabla system_permissions no existe')
      process.exit(1)
    }
    console.log('✅ Tabla system_permissions existe')

    // Contar permisos
    const count = await prisma.permission.count()
    console.log(`✅ Total de permisos en la tabla: ${count}`)

    // Mostrar algunos permisos de ejemplo
    const sample = await prisma.permission.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (sample) {
      console.log('\n📋 Ejemplo de permiso migrado:')
      console.log(`   - Nombre: ${sample.name}`)
      console.log(`   - Módulo: ${sample.module}`)
      console.log(`   - Acción: ${sample.action}`)
      console.log(`   - Activo: ${sample.isActive ? 'Sí' : 'No'}`)
      console.log(`   - Descripción: ${sample.description || 'N/A'}`)
    }

    // Verificar permisos activos vs inactivos
    const activeCount = await prisma.permission.count({
      where: { isActive: true },
    })
    const inactiveCount = await prisma.permission.count({
      where: { isActive: false },
    })

    console.log(`\n📊 Estadísticas:`)
    console.log(`   - Permisos activos: ${activeCount}`)
    console.log(`   - Permisos inactivos: ${inactiveCount}`)

    // Verificar roles que tienen permisos
    const roles = await prisma.role.findMany({
      where: {
        name: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
    })

    console.log(`\n👥 Roles verificados: ${roles.length}`)
    for (const role of roles) {
      const permissions = (role.permissions || [])
      if (permissions.length > 0) {
        console.log(`   - ${role.name}: ${permissions.length} permisos`)
      }
    }

    console.log('\n✨ Verificación completada exitosamente')

  } catch (error) {
    console.error('❌ Error en la verificación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error:', error)
    process.exit(1)
  })

