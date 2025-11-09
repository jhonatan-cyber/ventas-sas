/**
 * Script para actualizar la contraseña de un usuario
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updatePassword() {
  try {
    const email = 'maria@gmail.com'
    const newPassword = '10101010'

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
    console.log(`   - CI: ${user.ci || 'N/A'}`)
    console.log(`   - Rol: ${user.role}`)

    // Hashear nueva contraseña
    console.log(`\n🔐 Hasheando nueva contraseña...`)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    console.log(`✅ Contraseña actualizada exitosamente`)
    console.log(`   - Nueva contraseña: ${newPassword}`)
    console.log(`   - Hash generado: ${hashedPassword.substring(0, 30)}...`)

    // Verificar que la contraseña funciona
    const verification = await bcrypt.compare(newPassword, hashedPassword)
    console.log(`   - Verificación: ${verification ? '✅ Correcta' : '❌ Error'}`)

  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updatePassword()
  .then(() => {
    console.log('\n✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })

