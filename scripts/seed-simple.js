import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Hashear la contraseña
  const password = '10571705'
  const hashedPassword = await bcrypt.hash(password, 12)

  // Verificar si el usuario ya existe
  const existingUser = await prisma.profile.findUnique({
    where: { email: 'jhonatananasi@gmail.com' }
  })

  if (existingUser) {
    console.log('⚠️  El usuario jhonatananasi@gmail.com ya existe. Actualizando...')
    
    // Actualizar el usuario existente
    await prisma.profile.update({
      where: { email: 'jhonatananasi@gmail.com' },
      data: {
        password: hashedPassword,
        role: 'Super Administrador',
        isSuperAdmin: true,
        isActive: true,
        fullName: 'Jhonatan Anasi'
      }
    })
    
    console.log('✅ Usuario actualizado correctamente')
  } else {
    // Crear el usuario
    const user = await prisma.profile.create({
      data: {
        email: 'jhonatananasi@gmail.com',
        password: hashedPassword,
        fullName: 'Jhonatan Anasi',
        role: 'Super Administrador',
        isSuperAdmin: true,
        isActive: true
      }
    })

    console.log('✅ Usuario creado correctamente:', {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin
    })
  }

  console.log('✨ Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

