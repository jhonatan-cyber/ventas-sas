/**
 * Script para actualizar el rol de un usuario a Administrador
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateUserRole() {
  try {
    const email = 'maria@gmail.com'
    const newRole = 'Administrador'

    console.log(`🔍 Buscando usuario: ${email}...\n`)

    // Buscar usuario por email
    const user = await prisma.profile.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${email}`)
      process.exit(1)
      return
    }

    console.log('✅ Usuario encontrado:')
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Nombre: ${user.fullName || 'N/A'}`)
    console.log(`   - Rol actual: ${user.role}`)
    console.log(`   - Super Admin: ${user.isSuperAdmin ? 'Sí' : 'No'}`)

    // Actualizar rol
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        role: newRole,
      },
    })

    console.log(`\n✅ Rol actualizado exitosamente`)
    console.log(`   - Nuevo rol: ${newRole}`)
    console.log(`\n📝 Ahora el usuario puede acceder al sistema de administración`)

  } catch (error) {
    console.error('❌ Error al actualizar rol:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole()
  .then(() => {
    console.log('\n✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })

