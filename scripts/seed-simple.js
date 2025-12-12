import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  try {
    // Verificar si el usuario admin ya existe
    const existingUser = await prisma.profile.findUnique({
      where: { email: 'jhonatanancasi@gmail.com' }
    })

    if (existingUser) {
      console.log('✅ El seed ya fue ejecutado. El usuario admin ya existe.')
      console.log(`   Usuario ID: ${existingUser.id}`)
      console.log(`   Email: ${existingUser.email}`)
      return
    }

    // Crear usuario administrador
    console.log('👤 Creando usuario administrador...')
    const password = '10571705'
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.profile.create({
      data: {
        email: 'jhonatanancasi@gmail.com',
        password: hashedPassword,
        fullName: 'Jhonatan Anasi',
        role: 'Super Administrador',
        isSuperAdmin: true,
        isActive: true
      }
    })

    console.log('✅ Usuario administrador creado exitosamente:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nombre: ${user.fullName}`)
    console.log(`   Rol: ${user.role}`)
    console.log('')
    console.log('🔑 Credenciales de acceso:')
    console.log(`   Email: jhonatanancasi@gmail.com`)
    console.log(`   Contraseña: 10571705`)
    console.log('')
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login')
    console.log('')
    console.log('🚀 Puedes acceder al sistema de administración en: /administracion/login')

  } catch (error) {
    console.error('❌ Error ejecutando seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('💥 Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })