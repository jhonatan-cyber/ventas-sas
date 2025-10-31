// Simple Prisma connection test
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Conexión a PostgreSQL exitosa')
    process.exit(0)
  } catch (e) {
    console.error('❌ Error de conexión:', e && e.message ? e.message : e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
