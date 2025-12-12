/**
 * Script para migrar los permisos de roles existentes al nuevo formato
 * 
 * Uso:
 * npx tsx scripts/migrate-role-permissions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_PERMISSIONS = [
  // Dashboard
  'dashboard_view', 'dashboard_read',
  // Ventas
  'ventas_view', 'ventas_create', 'ventas_read', 'ventas_update', 'ventas_delete',
  // Productos
  'productos_view', 'productos_create', 'productos_read', 'productos_update', 'productos_delete',
  // Inventario
  'inventario_view', 'inventario_create', 'inventario_read', 'inventario_update', 'inventario_delete',
  // Clientes
  'clientes_view', 'clientes_create', 'clientes_read', 'clientes_update', 'clientes_delete',
  // Categorías
  'categorias_view', 'categorias_create', 'categorias_read', 'categorias_update', 'categorias_delete',
  // Reportes
  'reportes_view', 'reportes_read', 'reportes_export',
  // Analytics
  'analytics_view', 'analytics_read',
  // Configuración
  'configuracion_view', 'configuracion_read', 'configuracion_update',
  // Usuarios
  'usuarios_view', 'usuarios_create', 'usuarios_read', 'usuarios_update', 'usuarios_delete',
  // Roles
  'roles_view', 'roles_create', 'roles_read', 'roles_update', 'roles_delete',
  // Permisos
  'permisos_view', 'permisos_read', 'permisos_update',
  // Cajas
  'cajas_view', 'cajas_create', 'cajas_read', 'cajas_update', 'cajas_delete', 'cajas_open', 'cajas_close',
  // Gastos
  'gastos_view', 'gastos_create', 'gastos_read', 'gastos_update', 'gastos_delete',
  // Cotizaciones
  'cotizaciones_view', 'cotizaciones_create', 'cotizaciones_read', 'cotizaciones_update', 'cotizaciones_delete',
  // Sucursales
  'sucursales_view', 'sucursales_create', 'sucursales_read', 'sucursales_update', 'sucursales_delete',
]

async function migrateRolePermissions() {
  console.log('🔄 Iniciando migración de permisos de roles...\n')

  try {
    // Buscar todos los roles con nombre "Administrador"
    const adminRoles = await prisma.roleSas.findMany({
      where: {
        nombre: {
          equals: 'Administrador',
          mode: 'insensitive'
        }
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    console.log(`📋 Encontrados ${adminRoles.length} roles de Administrador\n`)

    let updated = 0
    let skipped = 0

    for (const role of adminRoles) {
      const currentPermissions = role.permissions as any
      
      // Verificar si ya tiene el nuevo formato (array de strings)
      if (Array.isArray(currentPermissions) && currentPermissions.length > 0) {
        console.log(`⏭️  Saltando rol "${role.nombre}" de ${role.organization.name} (${role.organization.slug}) - Ya tiene permisos en nuevo formato`)
        skipped++
        continue
      }

      // Actualizar con los nuevos permisos
      await prisma.roleSas.update({
        where: { id: role.id },
        data: {
          permissions: ADMIN_PERMISSIONS
        }
      })

      console.log(`✅ Actualizado rol "${role.nombre}" de ${role.organization.name} (${role.organization.slug})`)
      updated++
    }

    console.log(`\n✨ Migración completada:`)
    console.log(`   - ${updated} roles actualizados`)
    console.log(`   - ${skipped} roles saltados (ya tenían permisos)`)

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
migrateRolePermissions()
  .then(() => {
    console.log('\n🎉 Migración finalizada exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
