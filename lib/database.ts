import { prisma } from './prisma'

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
      console.log('✅ Conectado a la base de datos PostgreSQL')
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error)
      throw error
    }
  }

  // Desconectar de la base de datos
  static async disconnect() {
    try {
      await prisma.$disconnect()
      console.log('✅ Desconectado de la base de datos')
    } catch (error) {
      console.error('❌ Error desconectando de la base de datos:', error)
      throw error
    }
  }

  // Verificar estado de la conexión
  static async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'healthy', message: 'Base de datos conectada' }
    } catch (error) {
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
      console.error('Error obteniendo estadísticas:', error)
      return null
    }
  }
}

export { prisma }
export default DatabaseService
