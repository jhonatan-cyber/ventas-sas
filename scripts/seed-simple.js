const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Admin profile
  const adminEmail = 'admin@example.com'
  const adminPassword = 'Admin123!'
  const adminHashed = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.profile.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminHashed,
      fullName: 'Super Admin',
      role: 'admin',
      isSuperAdmin: true,
      isActive: true,
    },
  })

  // Organization demo
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Organizacion Demo',
      slug: 'demo',
      ownerId: admin.id,
      subscriptionStatus: 'trial',
    },
  })

  // Membership
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: admin.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: admin.id,
      isActive: true,
    },
  })

  // Customer demo (para SAS)
  const customer = await prisma.customer.upsert({
    where: { slug: 'cliente-demo' },
    update: {},
    create: {
      userId: admin.id,
      organizationId: org.id,
      razonSocial: 'Cliente Demo S.R.L.',
      slug: 'cliente-demo',
      nombre: 'Cliente',
      apellido: 'Demo',
      isActive: true,
    },
  })

  // Branch demo
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-demo' },
    update: {},
    create: {
      id: 'branch-demo',
      organizationId: org.id,
      name: 'Sucursal Central',
      isActive: true,
    },
  })

  // Rol SAS demo
  const roleSas = await prisma.roleSas.upsert({
    where: { id: 'rol-sas-demo' },
    update: {},
    create: {
      id: 'rol-sas-demo',
      nombre: 'Vendedor',
      descripcion: 'Acceso básico al sistema SAS',
      customerId: customer.id,
      sucursalId: branch.id,
      isActive: true,
    },
  })

  // Usuario SAS demo
  const sasEmail = 'sas@example.com'
  const sasPassword = 'Sas12345!'
  const sasHashed = await bcrypt.hash(sasPassword, 12)

  const usuarioSas = await prisma.usuarioSas.upsert({
    where: { correo: sasEmail },
    update: {},
    create: {
      nombre: 'SAS',
      apellido: 'Demo',
      correo: sasEmail,
      contraseña: sasHashed,
      rolId: roleSas.id,
      sucursalId: branch.id,
      customerId: customer.id,
      isActive: true,
    },
  })

  console.log('✅ Seed completado:')
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`)
  console.log(`  SAS:   ${sasEmail} / ${sasPassword}`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
