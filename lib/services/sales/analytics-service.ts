import { getCachedData } from '@/lib/cache/cache-service'
import { prisma } from '@/lib/prisma'

export interface SalesTimeSeries {
  date: string
  sales: number
  revenue: number
}

export interface ProductAnalytics {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface QuotationAnalytics {
  date: string
  created: number
  converted: number
  expired: number
}

export interface RevenueAnalytics {
  date: string
  revenue: number
  expenses?: number
  profit?: number
}

export class AnalyticsService {
  /**
   * Obtener serie temporal de ventas
   * @param organizationId ID de la organización
   * @param period 'daily' | 'weekly' | 'monthly'
   * @param days Número de días hacia atrás (default: 30)
   */
  static async getSalesTimeSeries(
    organizationId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30
  ): Promise<SalesTimeSeries[]> {
    const cacheKey = `analytics:sales:${organizationId}:${period}:${days}`
    
    return getCachedData(
      cacheKey,
      async () => {
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - days)

        // Obtener todas las ventas en el período
        const sales = await prisma.sale.findMany({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            total: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        // Agrupar por período
        const grouped = new Map<string, { sales: number; revenue: number }>()

        sales.forEach((sale) => {
          const date = new Date(sale.createdAt)
          let key: string

          if (period === 'daily') {
            key = date.toISOString().split('T')[0] // YYYY-MM-DD
          } else if (period === 'weekly') {
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            key = weekStart.toISOString().split('T')[0]
          } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          }

          const current = grouped.get(key) || { sales: 0, revenue: 0 }
          grouped.set(key, {
            sales: current.sales + 1,
            revenue: current.revenue + Number(sale.total),
          })
        })

        // Rellenar períodos sin ventas
        const result: SalesTimeSeries[] = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          let key: string

          if (period === 'daily') {
            key = currentDate.toISOString().split('T')[0]
            currentDate.setDate(currentDate.getDate() + 1)
          } else if (period === 'weekly') {
            const weekStart = new Date(currentDate)
            weekStart.setDate(currentDate.getDate() - currentDate.getDay())
            key = weekStart.toISOString().split('T')[0]
            currentDate.setDate(currentDate.getDate() + 7)
          } else {
            key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
            currentDate.setMonth(currentDate.getMonth() + 1)
          }

          const data = grouped.get(key) || { sales: 0, revenue: 0 }
          result.push({
            date: key,
            sales: data.sales,
            revenue: data.revenue,
          })

          if (currentDate > endDate) break
        }

        return result
      },
      300 // Cache por 5 minutos
    )
  }

  /**
   * Obtener productos más vendidos con analytics
   */
  static async getTopProducts(
    organizationId: string,
    limit: number = 10
  ): Promise<ProductAnalytics[]> {
    const cacheKey = `analytics:products:${organizationId}:${limit}`

    return getCachedData(
      cacheKey,
      async () => {
        // Obtener items agrupados por producto
        const topItems = await prisma.saleItem.groupBy({
          by: ['productId'],
          where: {
            sale: {
              organizationId,
            },
          },
          _sum: {
            quantity: true,
            subtotal: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: limit,
        })

        // Obtener información de productos
        const productIds = topItems.map((item) => item.productId)
        const products = await prisma.salesProduct.findMany({
          where: {
            id: { in: productIds },
            organizationId,
          },
          select: {
            id: true,
            name: true,
          },
        })

        const productMap = new Map(products.map((p) => [p.id, p]))

        return topItems
          .map((item) => {
            const product = productMap.get(item.productId)
            return {
              productId: item.productId,
              productName: product?.name || 'Producto eliminado',
              quantitySold: item._sum.quantity || 0,
              revenue: Number(item._sum.subtotal || 0),
            }
          })
          .filter((item) => item.productName !== 'Producto eliminado')
      },
      300 // Cache por 5 minutos
    )
  }

  /**
   * Obtener analytics de cotizaciones
   */
  static async getQuotationAnalytics(
    organizationId: string,
    days: number = 30
  ): Promise<QuotationAnalytics[]> {
    const cacheKey = `analytics:quotations:${organizationId}:${days}`

    return getCachedData(
      cacheKey,
      async () => {
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - days)

        const quotations = await prisma.quotation.findMany({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            status: true,
            // Asumimos que una cotización convertida tiene una venta asociada
            // Esto requeriría una relación en el schema, pero por ahora usamos status
          },
        })

        // Agrupar por día
        const grouped = new Map<
          string,
          { created: number; converted: number; expired: number }
        >()

        quotations.forEach((q) => {
          const date = q.createdAt.toISOString().split('T')[0]
          const current = grouped.get(date) || {
            created: 0,
            converted: 0,
            expired: 0,
          }

          current.created++
          if (q.status === 'converted' || q.status === 'approved') {
            current.converted++
          } else if (q.status === 'expired') {
            current.expired++
          }

          grouped.set(date, current)
        })

        // Rellenar días sin cotizaciones
        const result: QuotationAnalytics[] = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          const key = currentDate.toISOString().split('T')[0]
          const data = grouped.get(key) || {
            created: 0,
            converted: 0,
            expired: 0,
          }

          result.push({
            date: key,
            ...data,
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

        return result
      },
      300 // Cache por 5 minutos
    )
  }

  /**
   * Obtener analytics de ingresos vs gastos
   */
  static async getRevenueAnalytics(
    organizationId: string,
    days: number = 30
  ): Promise<RevenueAnalytics[]> {
    const cacheKey = `analytics:revenue:${organizationId}:${days}`

    return getCachedData(
      cacheKey,
      async () => {
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - days)

        // Obtener ventas
        const sales = await prisma.sale.findMany({
          where: {
            organizationId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            createdAt: true,
            total: true,
          },
        })

        // Obtener gastos
        const expenses = await prisma.expense.findMany({
          where: {
            organizationId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            date: true,
            amount: true,
          },
        })

        // Agrupar por día
        const grouped = new Map<
          string,
          { revenue: number; expenses: number }
        >()

        sales.forEach((sale) => {
          const date = sale.createdAt.toISOString().split('T')[0]
          const current = grouped.get(date) || { revenue: 0, expenses: 0 }
          grouped.set(date, {
            revenue: current.revenue + Number(sale.total),
            expenses: current.expenses,
          })
        })

        expenses.forEach((expense) => {
          const date = expense.date.toISOString().split('T')[0]
          const current = grouped.get(date) || { revenue: 0, expenses: 0 }
          grouped.set(date, {
            revenue: current.revenue,
            expenses: current.expenses + Number(expense.amount),
          })
        })

        // Rellenar días
        const result: RevenueAnalytics[] = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          const key = currentDate.toISOString().split('T')[0]
          const data = grouped.get(key) || { revenue: 0, expenses: 0 }

          result.push({
            date: key,
            revenue: data.revenue,
            expenses: data.expenses,
            profit: data.revenue - data.expenses,
          })

          currentDate.setDate(currentDate.getDate() + 1)
        }

        return result
      },
      300 // Cache por 5 minutos
    )
  }

  /**
   * Obtener comparación con período anterior
   */
  static async getPeriodComparison(
    organizationId: string,
    days: number = 30
  ) {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    const previousEndDate = new Date(startDate)
    const previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)

    const [currentPeriod, previousPeriod] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: previousStartDate,
            lte: previousEndDate,
          },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
    ])

    const currentSales = currentPeriod._count.id
    const previousSales = previousPeriod._count.id
    const currentRevenue = Number(currentPeriod._sum.total || 0)
    const previousRevenue = Number(previousPeriod._sum.total || 0)

    const salesChange =
      previousSales > 0
        ? ((currentSales - previousSales) / previousSales) * 100
        : currentSales > 0
          ? 100
          : 0

    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0

    return {
      sales: {
        current: currentSales,
        previous: previousSales,
        change: salesChange,
      },
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
      },
    }
  }
}

