/**
 * Helpers para base de datos de testing
 * 
 * Proporciona utilidades para limpiar y preparar la BD para tests
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Limpia todas las tablas de test
 * IMPORTANTE: Solo usar en ambiente de testing
 */
export async function cleanupTestDatabase() {
  // Orden importante para respetar foreign keys
  await prisma.salesProduct.deleteMany({})
  await prisma.saleItem.deleteMany({})
  await prisma.sale.deleteMany({})
  await prisma.quotationItem.deleteMany({})
  await prisma.quotation.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.cashRegister.deleteMany({})
  await prisma.usuarioSas.deleteMany({})
  await prisma.roleSas.deleteMany({})
  await prisma.salesCustomer.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.branch.deleteMany({})
  await prisma.customer.deleteMany({})
  await prisma.salesUser.deleteMany({})
  await prisma.userSession.deleteMany({})
  await prisma.sasSession.deleteMany({})
  await prisma.securityLog.deleteMany({})
  await prisma.passwordChange.deleteMany({})
  await prisma.jwtSecret.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.organizationMember.deleteMany({})
  await prisma.subscription.deleteMany({})
  await prisma.organization.deleteMany({})
  await prisma.profile.deleteMany({})
}

/**
 * Limpia datos específicos de test (con prefijo)
 */
export async function cleanupTestData(prefix: string = 'test_') {
  // Limpiar datos con prefijo de test
  await prisma.$executeRawUnsafe(`
    DELETE FROM sales_products WHERE name LIKE $1;
    DELETE FROM sales_customers WHERE name LIKE $1;
    DELETE FROM customers WHERE slug LIKE $1;
  `, `${prefix}%`)
}

/**
 * Crea datos de prueba mínimos para testing
 */
export async function seedTestData() {
  // Crear organización de test
  const organization = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
      ownerId: 'test-admin-id',
      subscriptionStatus: 'active',
    },
  })

  // Crear admin de test
  const admin = await prisma.profile.upsert({
    where: { email: 'test-admin@example.com' },
    update: {},
    create: {
      id: 'test-admin-id',
      email: 'test-admin@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5HjqK5r5p5x9C', // 'Test123!'
      fullName: 'Test Admin',
      role: 'admin',
      isSuperAdmin: true,
      isActive: true,
    },
  })

  // Crear customer de test para SAS
  const customer = await prisma.customer.upsert({
    where: { slug: 'test-customer' },
    update: {},
    create: {
      userId: admin.id,
      organizationId: organization.id,
      razonSocial: 'Test Customer S.R.L.',
      slug: 'test-customer',
      nombre: 'Test',
      apellido: 'Customer',
      email: 'test-customer@example.com',
      ci: '12345678',
      password: testPasswordHash,
      isActive: true,
    },
  })

  // Crear branch de test
  const branch = await prisma.branch.upsert({
    where: { id: 'test-branch-id' },
    update: {},
    create: {
      id: 'test-branch-id',
      organizationId: organization.id,
      name: 'Test Branch',
      isActive: true,
    },
  })

  // Crear role de test
  const role = await prisma.roleSas.upsert({
    where: { id: 'test-role-id' },
    update: {},
    create: {
      id: 'test-role-id',
      customerId: customer.id,
      nombre: 'Test Role',
      descripcion: 'Role de test',
      isActive: true,
    },
  })

  // Crear usuario SAS de test
  const usuarioSas = await prisma.usuarioSas.upsert({
    where: { ci: '87654321' },
    update: {},
    create: {
      ci: '87654321',
      nombre: 'Test',
      apellido: 'Usuario',
      correo: 'test-usuario@example.com',
      contraseña: testPasswordHash,
      customerId: customer.id,
      rolId: role.id,
      sucursalId: branch.id,
      isActive: true,
    },
  })

  return {
    organization,
    admin,
    customer,
    branch,
    role,
    usuarioSas,
  }
}

/**
 * Verifica que estamos en ambiente de test
 */
export function ensureTestEnvironment() {
  if (process.env.NODE_ENV !== 'test' && !process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests solo pueden ejecutarse en ambiente de test. Verifica DATABASE_URL.')
  }
}

