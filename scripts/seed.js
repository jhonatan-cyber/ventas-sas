/**
 * Script de seed para la base de datos
 * Crea el usuario administrador inicial del sistema
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...')

    // Verificar si el usuario admin ya existe
    const existingUser = await prisma.profile.findUnique({
      where: { email: 'jhonatanancasi@gmail.com' }
    })

    if (existingUser) {
      console.log('✅ El seed ya fue ejecutado. El usuario admin ya existe.')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Nombre: ${existingUser.fullName}`)
      return
    }

    // Crear usuario administrador
    const ci = '10571705'
    const hashedPassword = await bcrypt.hash(ci, 12) // CI hasheado como contraseña

    const user = await prisma.profile.create({
      data: {
        email: 'jhonatanancasi@gmail.com',
        password: hashedPassword, // CI hasheado para autenticación
        ci: ci, // CI real para mostrar en la tabla
        fullName: 'Jhonatan Anasi',
        role: 'Super Administrador',
        isSuperAdmin: true,
        isActive: true
      }
    })

    console.log('✅ Seed completado exitosamente')
    console.log('')
    console.log('👤 Usuario administrador creado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nombre: ${user.fullName}`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   Super Admin: ${user.isSuperAdmin}`)
    console.log('')
    console.log('🔐 Credenciales de acceso:')
    console.log(`   Email: jhonatanancasi@gmail.com + Contraseña: 10571705`)
    console.log(`   O usar CI: 10571705 + Contraseña: 10571705`)
    console.log('')
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login')
    console.log('')
    console.log('🌐 Acceso al sistema:')
    console.log(`   Admin: http://localhost:3000/administracion/login`)

  } catch (error) {
    console.error('❌ Error ejecutando seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el seed
main()