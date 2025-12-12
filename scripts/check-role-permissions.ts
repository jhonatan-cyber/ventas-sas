/**
 * Script para verificar los permisos de un rol específico
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkRolePermissions() {
  try {
    const roles = await prisma.roleSas.findMany({
      where: {
        organization: {
          slug: 'nuwesoft'
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

    console.log(`\n📋 Roles encontrados para organización "nuwesoft":\n`)

    for (const role of roles) {
      console.log(`\n🔹 Rol: ${role.nombre}`)
      console.log(`   ID: ${role.id}`)
      console.log(`   Usuarios asignados: ${role._count.usuariosSas}`)
      console.log(`   Activo: ${role.isActive}`)
      console.log(`   Permisos:`)
      
      const permissions = role.permissions as any
      
      if (!permissions) {
        console.log(`   ❌ Sin permisos definidos (null)`)
      } else if (Array.isArray(permissions)) {
        if (permissions.length === 0) {
          console.log(`   ⚠️  Array vacío - Sin permisos`)
        } else {
          console.log(`   ✅ ${permissions.length} permisos:`)
          permissions.forEach((p: string) => console.log(`      - ${p}`))
        }
      } else if (typeof permissions === 'object') {
        console.log(`   ⚠️  Formato antiguo (objeto):`)
        console.log(`   ${JSON.stringify(permissions, null, 2)}`)
      } else {
        console.log(`   ❓ Formato desconocido: ${typeof permissions}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRolePermissions()
