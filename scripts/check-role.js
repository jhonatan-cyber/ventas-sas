/**
 * Script para verificar si un rol existe en la base de datos
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRole() {
  try {
    const roleName = 'Ventas'

    console.log(`🔍 Buscando rol: ${roleName}...\n`)

    // Buscar rol por nombre
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    })

    if (!role) {
      console.log(`❌ Rol no encontrado: ${roleName}`)
      console.log('\n📝 El rol no existe en la base de datos.')
      console.log('\n💡 Opciones:')
      console.log('   1. Crear el rol "Ventas" en el módulo de roles')
      console.log('   2. Usar el rol "Administrador" que ya existe')
      return
    }

    console.log('✅ Rol encontrado:')
    console.log(`   - ID: ${role.id}`)
    console.log(`   - Nombre: ${role.name}`)
    console.log(`   - Descripción: ${role.description || 'N/A'}`)
    console.log(`   - Activo: ${role.isActive ? '✅ Sí' : '❌ No'}`)
    console.log(`   - Creado: ${role.createdAt}`)
    console.log(`   - Permisos: ${Array.isArray(role.permissions) ? role.permissions.length : 0}`)

    if (!role.isActive) {
      console.log('\n⚠️  El rol está INACTIVO')
      console.log('   - Los usuarios con este rol NO podrán acceder al sistema')
      console.log('   - Debes activar el rol en el módulo de roles')
    } else {
      console.log('\n✅ El rol está activo')
      console.log('   - Los usuarios con este rol pueden acceder al sistema')
    }

  } catch (error) {
    console.error('❌ Error al verificar rol:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkRole()
  .then(() => {
    console.log('\n✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })

