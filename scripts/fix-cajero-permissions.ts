/**
 * Script para ajustar los permisos del rol Cajero a un conjunto apropiado
 * 
 * Uso:
 * npx tsx scripts/fix-cajero-permissions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Permisos apropiados para un Cajero
const CAJERO_PERMISSIONS = [
  // Ventas - puede crear y ver ventas
  'ventas_crear',
  'ventas_listar',
  'ventas_ver_detalles',
  
  // Cajas - puede abrir, cerrar y ver cajas
  'cajas_crear',
  'cajas_listar',
  'cajas_ver_detalles',
  
  // Productos - solo lectura para consultar precios y stock
  'productos_listar',
  'productos_ver_detalles',
  
  // Clientes - puede crear y consultar clientes
  'clientes_crear',
  'clientes_listar',
  'clientes_ver_detalles',
  
  // Cotizaciones - puede crear y ver cotizaciones (opcional)
  'cotizaciones_crear',
  'cotizaciones_listar',
  'cotizaciones_ver_detalles',
]

async function fixCajeroPermissions() {
  console.log('🔄 Ajustando permisos del rol Cajero...\n')

  try {
    // Buscar todos los roles con nombre "Cajero"
    const cajeroRoles = await prisma.roleSas.findMany({
      where: {
        nombre: {
          equals: 'Cajero',
          mode: 'insensitive'
        }
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            usuariosSas: true
          }
        }
      }
    })

    console.log(`📋 Encontrados ${cajeroRoles.length} roles de Cajero\n`)

    if (cajeroRoles.length === 0) {
      console.log('⚠️  No se encontraron roles de Cajero para actualizar')
      return
    }

    for (const role of cajeroRoles) {
      const currentPermissions = role.permissions as any
      const currentCount = Array.isArray(currentPermissions) ? currentPermissions.length : 0
      
      console.log(`\n🔹 Rol: ${role.nombre}`)
      console.log(`   Organización: ${role.organization.name} (${role.organization.slug})`)
      console.log(`   Usuarios asignados: ${role._count.usuariosSas}`)
      console.log(`   Permisos actuales: ${currentCount}`)
      console.log(`   Permisos nuevos: ${CAJERO_PERMISSIONS.length}`)

      // Actualizar con los nuevos permisos
      await prisma.roleSas.update({
        where: { id: role.id },
        data: {
          permissions: CAJERO_PERMISSIONS
        }
      })

      console.log(`   ✅ Permisos actualizados`)
      
      // Mostrar permisos removidos
      if (Array.isArray(currentPermissions)) {
        const removed = currentPermissions.filter(p => !CAJERO_PERMISSIONS.includes(p))
        if (removed.length > 0) {
          console.log(`   ❌ Permisos removidos (${removed.length}):`)
          removed.forEach(p => console.log(`      - ${p}`))
        }
      }
    }

    console.log(`\n✨ Actualización completada`)
    console.log(`\n📝 Permisos finales del rol Cajero:`)
    CAJERO_PERMISSIONS.forEach(p => console.log(`   ✓ ${p}`))

  } catch (error) {
    console.error('❌ Error durante la actualización:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la actualización
fixCajeroPermissions()
  .then(() => {
    console.log('\n🎉 Script finalizado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
