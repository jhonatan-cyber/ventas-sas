import { prisma } from "@/lib/prisma"

export class SalesDashboardService {
  // Obtener estadísticas del dashboard
  static async getDashboardStats(organizationId: string) {
    const [
      totalSales,
      totalRevenue,
      totalCustomers,
      totalProducts,
      salesThisMonth,
      revenueThisMonth
    ] = await Promise.all([
      // Total de ventas
      prisma.sale.count({
        where: { organizationId }
      }),
      
      // Ingresos totales
      prisma.sale.aggregate({
        where: { organizationId },
        _sum: { total: true }
      }),
      
      // Total de clientes
      prisma.salesCustomer.count({
        where: { organizationId, isActive: true }
      }),
      
      // Total de productos activos
      prisma.salesProduct.count({
        where: { organizationId, isActive: true }
      }),
      
      // Ventas del mes actual
      prisma.sale.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Ingresos del mes actual
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { total: true }
      })
    ])

    return {
      totalSales,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      totalCustomers,
      totalProducts,
      salesThisMonth,
      revenueThisMonth: Number(revenueThisMonth._sum.total || 0)
    }
  }

  // Obtener ventas recientes
  static async getRecentSales(organizationId: string, limit: number = 5) {
    return prisma.sale.findMany({
      where: { organizationId },
      include: {
        customer: true,
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Obtener productos más vendidos
  static async getTopProducts(organizationId: string, limit: number = 5) {
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: { organizationId }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    })

    const products = await prisma.salesProduct.findMany({
      where: {
        id: { in: topProducts.map(p => p.productId) },
        organizationId
      }
    })

    return topProducts.map(item => {
      const product = products.find(p => p.id === item.productId)
      return {
        product,
        quantitySold: item._sum.quantity || 0
      }
    }).filter(item => item.product)
  }
}

