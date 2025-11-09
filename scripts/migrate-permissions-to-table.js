/**
 * Script para migrar permisos de roles especiales a la tabla Permission
 * Este script:
 * 1. Extrae permisos del rol "Permisos Registrados"
 * 2. Extrae permisos desactivados del rol "Permisos Desactivados"
 * 3. Crea registros en la tabla system_permissions
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migratePermissions() {
  try {
    console.log('🚀 Iniciando migración de permisos...')

    // Buscar rol "Permisos Registrados"
    const registryRole = await prisma.role.findFirst({
      where: { name: 'Permisos Registrados' },
    })

    // Buscar rol "Permisos Desactivados"
    const deactivatedRole = await prisma.role.findFirst({
      where: { name: 'Permisos Desactivados' },
    })

    const registryPermissions = (registryRole?.permissions || []) 
    const deactivatedPermissions = (deactivatedRole?.permissions || [])

    console.log(`📋 Encontrados ${registryPermissions.length} permisos registrados`)
    console.log(`📋 Encontrados ${deactivatedPermissions.length} permisos desactivados`)

    // Extraer módulo y acción de cada permiso
    const permissionsToCreate = new Map()

    // Procesar permisos registrados
    for (const permName of registryPermissions) {
      const parts = permName.split('_')
      const module = parts[0] || 'unknown'
      const action = parts.slice(1).join('_') || 'unknown'
      
      const isActive = !deactivatedPermissions.includes(permName)

      permissionsToCreate.set(permName, {
        name: permName,
        module,
        action,
        description: generateDescription(module, action),
        isActive,
      })
    }

    // Procesar permisos solo desactivados (no en registrados)
    for (const permName of deactivatedPermissions) {
      if (!permissionsToCreate.has(permName)) {
        const parts = permName.split('_')
        const module = parts[0] || 'unknown'
        const action = parts.slice(1).join('_') || 'unknown'
        
        permissionsToCreate.set(permName, {
          name: permName,
          module,
          action,
          description: generateDescription(module, action),
          isActive: false,
        })
      }
    }

    console.log(`📝 Total de permisos únicos a crear: ${permissionsToCreate.size}`)

    // Crear permisos en la base de datos
    let created = 0
    let skipped = 0

    for (const [name, perm] of permissionsToCreate) {
      try {
        await prisma.permission.upsert({
          where: { name },
          update: {
            module: perm.module,
            action: perm.action,
            description: perm.description,
            isActive: perm.isActive,
          },
          create: {
            name: perm.name,
            module: perm.module,
            action: perm.action,
            description: perm.description,
            isActive: perm.isActive,
          },
        })
        created++
      } catch (error) {
        console.error(`❌ Error al crear permiso ${name}:`, error.message)
        skipped++
      }
    }

    console.log(`✅ Migración completada:`)
    console.log(`   - Permisos creados/actualizados: ${created}`)
    console.log(`   - Permisos omitidos: ${skipped}`)

    // Verificar permisos en roles que no sean los especiales
    const allRoles = await prisma.role.findMany({
      where: {
        name: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
    })

    console.log(`\n📊 Verificando permisos en ${allRoles.length} roles...`)
    
    for (const role of allRoles) {
      const rolePermissions = (role.permissions || [])
      if (rolePermissions.length > 0) {
        console.log(`   - Rol "${role.name}": ${rolePermissions.length} permisos`)
      }
    }

  } catch (error) {
    console.error('❌ Error en la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function generateDescription(module, action) {
  const moduleLabels = {
    'usuarios': 'Usuarios',
    'roles': 'Roles',
    'permisos': 'Permisos',
    'organizaciones': 'Organizaciones',
    'planes': 'Planes',
    'suscripciones': 'Suscripciones',
    'clientes': 'Clientes',
    'facturacion': 'Facturación y Pagos',
    'cms': 'CMS',
    'white_label': 'White Label',
    'integraciones': 'Integraciones',
    'dominios': 'Dominios Personalizados',
    'notificaciones': 'Notificaciones Masivas',
    'feedback': 'Feedback',
    'soporte': 'Soporte',
    'logs': 'Logs y Auditoría',
    'export': 'Exportación de Datos',
    'health': 'Salud del Sistema',
    'versions': 'Versiones',
    'ab_tests': 'Pruebas A/B',
    'configuracion': 'Configuración General',
    'cache': 'Gestión de Caché',
    'analytics': 'Analytics',
  }

  const actionLabels = {
    'listar': 'Listar',
    'ver_detalles': 'Ver detalles',
    'crear': 'Crear',
    'editar': 'Editar',
    'eliminar': 'Eliminar',
    'activar': 'Activar',
    'desactivar': 'Desactivar',
  }

  const moduleLabel = moduleLabels[module] || module
  const actionLabel = actionLabels[action] || action

  return `${actionLabel} ${moduleLabel.toLowerCase()}`
}

// Ejecutar migración
migratePermissions()
  .then(() => {
    console.log('\n✨ Migración finalizada exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error en la migración:', error)
    process.exit(1)
  })

