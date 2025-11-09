/**
 * Script para verificar si un usuario existe en la base de datos
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const email = 'maria@gmail.com'
    const password = '10101010'

    console.log(`🔍 Buscando usuario: ${email}...\n`)

    // Buscar usuario por email
    const user = await prisma.profile.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        ci: true,
      },
    })

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${email}`)
      console.log('\n📝 El usuario no existe en la base de datos.')
      return
    }

    console.log('✅ Usuario encontrado:')
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Nombre: ${user.fullName || 'N/A'}`)
    console.log(`   - CI: ${user.ci || 'N/A'}`)
    console.log(`   - Rol: ${user.role}`)
    console.log(`   - Super Admin: ${user.isSuperAdmin ? 'Sí' : 'No'}`)
    console.log(`   - Activo: ${user.isActive ? 'Sí' : 'No'}`)
    console.log(`   - Creado: ${user.createdAt}`)
    console.log(`   - Actualizado: ${user.updatedAt}`)
    console.log(`   - Tiene contraseña: ${user.password ? 'Sí' : 'No'}`)

    // Verificar contraseña si existe
    if (user.password) {
      try {
        const isValid = await bcrypt.compare(password, user.password)
        console.log(`\n🔐 Verificación de contraseña:`)
        console.log(`   - Contraseña "${password}" es válida: ${isValid ? '✅ Sí' : '❌ No'}`)
        
        if (!isValid) {
          // También verificar si la contraseña es igual al CI (caso común)
          if (user.ci) {
            const ciMatch = await bcrypt.compare(user.ci, user.password)
            console.log(`   - Contraseña coincide con CI: ${ciMatch ? '✅ Sí' : '❌ No'}`)
          }
        }
      } catch (error) {
        console.log(`\n⚠️  No se pudo verificar la contraseña: ${error.message}`)
        console.log(`   - Hash almacenado: ${user.password.substring(0, 20)}...`)
      }
    } else {
      console.log(`\n⚠️  El usuario no tiene contraseña configurada`)
    }

  } catch (error) {
    console.error('❌ Error al verificar usuario:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
  .then(() => {
    console.log('\n✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })

