import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Crear instancia de Prisma con configuración mejorada
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// Mantener la instancia en desarrollo para hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Manejar desconexión al cerrar la aplicación
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
