import { prisma } from './prisma'
import { logger } from './utils/logger'

// Funciones de utilidad para la base de datos
export class DatabaseService {
  // Obtener cliente de Prisma
  static getClient() {
    return prisma
  }

  // Conectar a la base de datos
  static async connect() {
    try {
      await prisma.$connect()
      logger.info('Conectado a la base de datos PostgreSQL', {
        type: 'database',
        operation: 'connect',
      })
    } catch (error) {
      logger.error('Error conectando a la base de datos', error as Error, {
        type: 'database',
        operation: 'connect',
      })
      throw error
    }
  }

  // Desconectar de la base de datos
  static async disconnect() {
    try {
      await prisma.$disconnect()
      logger.info('Desconectado de la base de datos', {
        type: 'database',
        operation: 'disconnect',
      })
    } catch (error) {
      logger.error('Error desconectando de la base de datos', error as Error, {
        type: 'database',
        operation: 'disconnect',
      })
      throw error
    }
  }

  // Verificar estado de la conexión
  static async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'healthy', message: 'Base de datos conectada' }
    } catch {
      return { status: 'unhealthy', message: 'Error de conexión a la base de datos' }
    }
  }

  // Obtener estadísticas de la base de datos
  static async getStats() {
    try {
      const [customers, products, orders, organizations] = await Promise.all([
        prisma.customer.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.organization.count()
      ])

      return {
        customers,
        products,
        orders,
        organizations
      }
    } catch (error) {
      logger.error('Error obteniendo estadísticas de base de datos', error as Error, {
        type: 'database',
        operation: 'getStats',
      })
      return null
    }
  }
}

export { prisma }
export default DatabaseService
