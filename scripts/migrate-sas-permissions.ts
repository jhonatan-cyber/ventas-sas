import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Módulos del sistema SAS
const SAS_MODULES = [
  'dashboard',
  'ventas',
  'cajas',
  'cotizaciones',
  'gastos',
  'productos',
  'categorias',
  'clientes',
  'usuarios',
  'roles',
  'permisos',
  'sucursales',
  'configuracion',
  'reportes',
]

async function migrateSasPermissions() {
  try {
    console.log('🚀 Iniciando migración de permisos del sistema SAS...')

    // Obtener todos los permisos del sistema de administración que pertenecen a módulos SAS
    const adminPermissions = await prisma.permission.findMany({
      where: {
        module: {
          in: SAS_MODULES,
        },
      },
    })

    console.log(`📋 Encontrados ${adminPermissions.length} permisos del sistema SAS en system_permissions`)

    if (adminPermissions.length === 0) {
      console.log('✅ No hay permisos para migrar')
      return
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    // Migrar cada permiso
    for (const permission of adminPermissions) {
      try {
        // Intentar crear el permiso en la nueva tabla
        // Si ya existe, se actualiza con upsert
        await prisma.permissionSas.upsert({
          where: {
            name: permission.name,
          },
          update: {
            module: permission.module,
            action: permission.action,
            description: permission.description,
            isActive: permission.isActive,
          },
          create: {
            name: permission.name,
            module: permission.module,
            action: permission.action,
            description: permission.description,
            isActive: permission.isActive,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
          },
        })

        migrated++
        console.log(`✅ Migrado: ${permission.name}`)
      } catch (error: any) {
        errors++
        console.error(`❌ Error al migrar ${permission.name}:`, error.message)
      }
    }

    console.log('\n📊 Resumen de migración:')
    console.log(`   ✅ Migrados: ${migrated}`)
    console.log(`   ⏭️  Omitidos: ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`\n🎉 Migración completada!`)

    // Verificar que los permisos se migraron correctamente
    const sasPermissionsCount = await prisma.permissionSas.count()
    console.log(`\n📈 Total de permisos en sales_permissions: ${sasPermissionsCount}`)
  } catch (error) {
    console.error('❌ Error fatal durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
migrateSasPermissions()
  .then(() => {
    console.log('\n✅ Script de migración finalizado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en el script de migración:', error)
    process.exit(1)
  })

