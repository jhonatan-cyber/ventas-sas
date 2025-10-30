import { prisma } from '../prisma'
import type { Order, OrderItem, Customer, Product } from '@prisma/client'

export class OrderService {
  // Obtener todas las órdenes de una organización
  static async getOrdersByOrganization(organizationId: string) {
    return await prisma.order.findMany({
      where: { organizationId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener todas las órdenes de un usuario
  static async getOrdersByUser(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener una orden por ID
  static async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        organization: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })
  }

  // Crear una nueva orden
  static async createOrder(data: {
    userId: string
    organizationId?: string
    customerId: string
    orderNumber: string
    status?: string
    total: number
    notes?: string
    orderItems: {
      productId: string
      quantity: number
      unitPrice: number
      subtotal: number
    }[]
  }) {
    return await prisma.order.create({
      data: {
        ...data,
        orderItems: {
          create: data.orderItems
        }
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })
  }

  // Actualizar una orden
  static async updateOrder(id: string, data: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>) {
    return await prisma.order.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })
  }

  // Eliminar una orden
  static async deleteOrder(id: string) {
    return await prisma.order.delete({
      where: { id }
    })
  }

  // Actualizar estado de una orden
  static async updateOrderStatus(id: string, status: string) {
    return await prisma.order.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    })
  }

  // Obtener órdenes por estado
  static async getOrdersByStatus(status: string, organizationId?: string) {
    const where = organizationId 
      ? { organizationId, status }
      : { status }

    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener órdenes recientes
  static async getRecentOrders(limit: number = 10, organizationId?: string) {
    const where = organizationId ? { organizationId } : {}
    
    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Buscar órdenes por número de orden o cliente
  static async searchOrders(query: string, organizationId?: string) {
    const where = organizationId 
      ? { 
          organizationId,
          OR: [
            { orderNumber: { contains: query, mode: 'insensitive' } },
            { customer: { name: { contains: query, mode: 'insensitive' } } },
            { customer: { email: { contains: query, mode: 'insensitive' } } }
          ]
        }
      : {
          OR: [
            { orderNumber: { contains: query, mode: 'insensitive' } },
            { customer: { name: { contains: query, mode: 'insensitive' } } },
            { customer: { email: { contains: query, mode: 'insensitive' } } }
          ]
        }

    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener estadísticas de órdenes
  static async getOrderStats(organizationId?: string) {
    const where = organizationId ? { organizationId } : {}
    
    const [total, totalRevenue, pending, completed] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { total: true }
      }),
      prisma.order.count({
        where: { ...where, status: 'pending' }
      }),
      prisma.order.count({
        where: { ...where, status: 'completed' }
      })
    ])

    return {
      total,
      totalRevenue: totalRevenue._sum.total || 0,
      pending,
      completed
    }
  }

  // Obtener ingresos por período
  static async getRevenueByPeriod(startDate: Date, endDate: Date, organizationId?: string) {
    const where = organizationId 
      ? { 
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      : {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }

    return await prisma.order.aggregate({
      where,
      _sum: { total: true },
      _count: { id: true }
    })
  }

  // Generar número de orden único
  static async generateOrderNumber(organizationId?: string) {
    const prefix = organizationId ? `ORG-${organizationId.slice(-4)}-` : 'ORD-'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    const orderNumber = `${prefix}${timestamp}-${random}`
    
    // Verificar que no exista
    const existing = await prisma.order.findUnique({
      where: { orderNumber }
    })
    
    if (existing) {
      return this.generateOrderNumber(organizationId)
    }
    
    return orderNumber
  }
}
