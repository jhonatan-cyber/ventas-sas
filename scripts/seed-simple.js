import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...')

    // Hashear la contraseña
    const password = '10571705'
    const hashedPassword = await bcrypt.hash(password, 12)

    // Verificar si el usuario ya existe
    const existingUser = await prisma.profile.findUnique({
      where: { email: 'jhonatanancasi@gmail.com' }
    })

    if (existingUser) {
      console.log('⚠️  El usuario jhonatanancasi@gmail.com ya existe. Actualizando...')
      
      // Actualizar el usuario existente
      await prisma.profile.update({
        where: { email: 'jhonatanancasi@gmail.com' },
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
          email: 'jhonatanancasi@gmail.com',
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
  } catch (error) {
    // Si el error es que el usuario ya existe (violación de constraint único), no fallar
    if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
      console.log('ℹ️  El usuario ya existe (probablemente creado en un build anterior). Continuando...')
      return
    }
    // Para otros errores, relanzar para que se maneje en el catch principal
    throw error
  }
}

main()
  .catch((e) => {
    // Si es un error de constraint único (usuario ya existe), no fallar
    if (e.code === 'P2002' || e.message?.includes('Unique constraint') || e.message?.includes('already exists')) {
      console.log('ℹ️  El usuario ya existe. Seed no necesario. Continuando...')
      process.exit(0)
    }
    
    // Para otros errores (conexión, etc.), fallar el build
    console.error('❌ Error crítico ejecutando el seed:', e)
    console.error('Stack:', e.stack)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

