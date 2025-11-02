const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')
  
  // Super Admin único
  const adminEmail = 'admin@gmail.com'
  const adminPassword = 'admin'
  const adminHashed = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.profile.upsert({
    where: { email: adminEmail },
    update: {
      password: adminHashed,
      fullName: 'Super Administrador',
      role: 'admin',
      isSuperAdmin: true,
      isActive: true,
    },
    create: {
      email: adminEmail,
      password: adminHashed,
      fullName: 'Super Administrador',
      role: 'admin',
      isSuperAdmin: true,
      isActive: true,
    },
  })

  console.log('✅ Seed completado:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Super Administrador creado:')
  console.log(`   Email:    ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📝 Puedes iniciar sesión en:')
  console.log('   http://localhost:3000/administracion/login')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
