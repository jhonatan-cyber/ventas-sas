import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed completo de la base de datos...')

  try {
    // 1. Crear usuario administrador si no existe
    let adminUser = await prisma.profile.findUnique({
      where: { email: 'jhonatanancasi@gmail.com' }
    })

    if (!adminUser) {
      console.log('👤 Creando usuario administrador...')
      const password = '10571705'
      const hashedPassword = await bcrypt.hash(password, 12)

      adminUser = await prisma.profile.create({
        data: {
          email: 'jhonatanancasi@gmail.com',
          password: hashedPassword,
          fullName: 'Jhonatan Anasi',
          role: 'Super Administrador',
          isSuperAdmin: true,
          isActive: true
        }
      })
      console.log('✅ Usuario administrador creado')
    } else {
      console.log('✅ Usuario administrador ya existe')
    }

    // 2. Crear plan básico si no existe
    let basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Plan Básico' }
    })

    if (!basicPlan) {
      console.log('📋 Creando plan básico...')
      basicPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Plan Básico',
          description: 'Plan básico para pequeñas empresas',
          priceMonthly: 29.99,
          priceYearly: 299.99,
          maxUsers: 5,
          maxBranches: 1,
          maxProducts: 1000,
          modules: ['dashboard', 'ventas', 'productos', 'clientes', 'reportes'],
          isActive: true,
          features: ['Gestión de ventas', 'Control de inventario', 'Reportes básicos']
        }
      })
      console.log('✅ Plan básico creado')
    } else {
      console.log('✅ Plan básico ya existe')
    }

    // 3. Crear organización de ejemplo si no existe
    let demoOrg = await prisma.organization.findFirst({
      where: { slug: 'demo-empresa' }
    })

    if (!demoOrg) {
      console.log('🏢 Creando organización de ejemplo...')
      demoOrg = await prisma.organization.create({
        data: {
          name: 'Demo Empresa',
          slug: 'demo-empresa',
          razonSocial: 'Demo Empresa S.A.S.',
          nit: '900123456-7',
          address: 'Calle 123 #45-67',
          phone: '+57 300 123 4567',
          website: 'https://demo-empresa.com'
        }
      })
      console.log('✅ Organización de ejemplo creada')
    } else {
      console.log('✅ Organización de ejemplo ya existe')
    }

    // 4. Crear suscripción activa para la organización demo
    const existingSubscription = await prisma.subscription.findFirst({
      where: { 
        organizationId: demoOrg.id,
        status: 'active'
      }
    })

    if (!existingSubscription) {
      console.log('💳 Creando suscripción activa...')
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1) // 1 año de duración

      await prisma.subscription.create({
        data: {
          organizationId: demoOrg.id,
          planId: basicPlan.id,
          status: 'active',
          billingPeriod: 'yearly',
          startDate: startDate,
          endDate: endDate,
          autoRenew: true
        }
      })
      console.log('✅ Suscripción activa creada')
    } else {
      console.log('✅ Suscripción activa ya existe')
    }

    // 5. Crear usuario SAS de ejemplo
    const existingSasUser = await prisma.usuarioSas.findFirst({
      where: { email: 'admin@demo-empresa.com' }
    })

    if (!existingSasUser) {
      console.log('👨‍💼 Creando usuario SAS de ejemplo...')
      const sasPassword = 'demo123'
      const hashedSasPassword = await bcrypt.hash(sasPassword, 12)

      await prisma.usuarioSas.create({
        data: {
          email: 'admin@demo-empresa.com',
          password: hashedSasPassword,
          nombre: 'Administrador',
          apellido: 'Demo',
          organizationId: demoOrg.id,
          isActive: true
        }
      })
      console.log('✅ Usuario SAS de ejemplo creado')
      console.log('   Email: admin@demo-empresa.com')
      console.log('   Contraseña: demo123')
    } else {
      console.log('✅ Usuario SAS de ejemplo ya existe')
    }

    console.log('')
    console.log('🎉 Seed completo ejecutado exitosamente!')
    console.log('')
    console.log('🔑 Credenciales del sistema:')
    console.log('')
    console.log('📊 ADMINISTRACIÓN DEL SISTEMA:')
    console.log('   URL: /administracion/login')
    console.log('   Email: jhonatanancasi@gmail.com')
    console.log('   Contraseña: 10571705')
    console.log('')
    console.log('🏪 SISTEMA DE VENTAS (Organización Demo):')
    console.log('   URL: /demo-empresa/login')
    console.log('   Email: admin@demo-empresa.com')
    console.log('   Contraseña: demo123')
    console.log('')
    console.log('⚠️  IMPORTANTE: Cambia las contraseñas después del primer login')

  } catch (error) {
    console.error('❌ Error ejecutando seed completo:', error)
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