import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Configuración optimizada de Prisma Client
 * 
 * Pool de conexiones:
 * - connection_limit: Controla cuántas conexiones simultáneas puede tener el pool
 * - pool_timeout: Tiempo máximo de espera para obtener una conexión del pool
 * 
 * Para configurar el pool, agrega parámetros a DATABASE_URL:
 * DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=10&pool_timeout=20"
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn', 'query'] 
    : ['error'],
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Mantener la instancia en desarrollo para hot reload (evita múltiples conexiones)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Manejar desconexión graceful al cerrar la aplicación
if (typeof window === 'undefined') {
  // Manejar cierre normal
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  // Manejar señales de terminación
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} recibido. Cerrando conexiones de base de datos...`)
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
