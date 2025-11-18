import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns"

export interface KPIData {
  id: string
  name: string
  value: number
  previousValue: number
  change: number
  changePercent: number
  format: 'currency' | 'number' | 'percentage'
  icon?: string
}

export interface TrendData {
  date: string
  value: number
  label?: string
}

export interface ProductProfitability {
  productId: string
  productName: string
  totalRevenue: number
  totalCost: number
  profit: number
  profitMargin: number
  unitsSold: number
  averagePrice: number
}

export interface CustomerSegment {
  segment: string
  count: number
  totalRevenue: number
  averageOrderValue: number
  description: string
}

export interface SalesPrediction {
  date: string
  predicted: number
  confidence: number
  lowerBound: number
  upperBound: number
}

export class AnalyticsService {
  // Obtener KPIs personalizables
  static async getKPIs(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const start = dateRange?.start || startOfMonth(new Date())
    const end = dateRange?.end || endOfMonth(new Date())
    const previousStart = subMonths(start, 1)
    const previousEnd = subMonths(end, 1)

    const [
      currentSales,
      previousSales,
      currentRevenue,
      previousRevenue,
      currentCustomers,
      previousCustomers,
      currentProducts,
      previousProducts,
      currentAvgOrderValue,
      previousAvgOrderValue,
    ] = await Promise.all([
      // Ventas actuales
      prisma.sale.count({
        where: {
          organizationId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        }
      }),
      // Ventas período anterior
      prisma.sale.count({
        where: {
          organizationId,
          createdAt: { gte: previousStart, lte: previousEnd },
          status: 'completed'
        }
      }),
      // Ingresos actuales
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        },
        _sum: { total: true }
      }),
      // Ingresos período anterior
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: { gte: previousStart, lte: previousEnd },
          status: 'completed'
        },
        _sum: { total: true }
      }),
      // Clientes nuevos actuales
      prisma.salesCustomer.count({
        where: {
          organizationId,
          createdAt: { gte: start, lte: end },
          isActive: true
        }
      }),
      // Clientes nuevos período anterior
      prisma.salesCustomer.count({
        where: {
          organizationId,
          createdAt: { gte: previousStart, lte: previousEnd },
          isActive: true
        }
      }),
      // Productos vendidos actuales (contar productos únicos)
      prisma.saleItem.findMany({
        where: {
          sale: {
            organizationId,
            createdAt: { gte: start, lte: end },
            status: 'completed'
          }
        },
        distinct: ['productId'],
        select: { productId: true }
      }).then(items => items.length),
      // Productos vendidos período anterior (contar productos únicos)
      prisma.saleItem.findMany({
        where: {
          sale: {
            organizationId,
            createdAt: { gte: previousStart, lte: previousEnd },
            status: 'completed'
          }
        },
        distinct: ['productId'],
        select: { productId: true }
      }).then(items => items.length),
      // Valor promedio de orden actual
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        },
        _avg: { total: true }
      }),
      // Valor promedio de orden período anterior
      prisma.sale.aggregate({
        where: {
          organizationId,
          createdAt: { gte: previousStart, lte: previousEnd },
          status: 'completed'
        },
        _avg: { total: true }
      }),
    ])

    const currentRevenueValue = Number(currentRevenue._sum.total || 0)
    const previousRevenueValue = Number(previousRevenue._sum.total || 0)
    const currentAvgOrder = Number(currentAvgOrderValue._avg.total || 0)
    const previousAvgOrder = Number(previousAvgOrderValue._avg.total || 0)

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const kpis: KPIData[] = [
      {
        id: 'total-sales',
        name: 'Total Ventas',
        value: currentSales,
        previousValue: previousSales,
        change: currentSales - previousSales,
        changePercent: calculateChange(currentSales, previousSales),
        format: 'number',
        icon: 'ShoppingCart'
      },
      {
        id: 'total-revenue',
        name: 'Ingresos Totales',
        value: currentRevenueValue,
        previousValue: previousRevenueValue,
        change: currentRevenueValue - previousRevenueValue,
        changePercent: calculateChange(currentRevenueValue, previousRevenueValue),
        format: 'currency',
        icon: 'DollarSign'
      },
      {
        id: 'new-customers',
        name: 'Nuevos Clientes',
        value: currentCustomers,
        previousValue: previousCustomers,
        change: currentCustomers - previousCustomers,
        changePercent: calculateChange(currentCustomers, previousCustomers),
        format: 'number',
        icon: 'Users'
      },
      {
        id: 'products-sold',
        name: 'Productos Vendidos',
        value: currentProducts,
        previousValue: previousProducts,
        change: currentProducts - previousProducts,
        changePercent: calculateChange(currentProducts, previousProducts),
        format: 'number',
        icon: 'Package'
      },
      {
        id: 'avg-order-value',
        name: 'Valor Promedio de Orden',
        value: currentAvgOrder,
        previousValue: previousAvgOrder,
        change: currentAvgOrder - previousAvgOrder,
        changePercent: calculateChange(currentAvgOrder, previousAvgOrder),
        format: 'currency',
        icon: 'TrendingUp'
      }
    ]

    return kpis
  }

  // Obtener datos de tendencias de ventas
  static async getSalesTrends(
    organizationId: string,
    days: number = 30,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TrendData[]> {
    const startDate = subDays(new Date(), days)
    const endDate = new Date()

    const sales = await prisma.sale.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      },
      select: {
        createdAt: true,
        total: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Agrupar por período
    const grouped = new Map<string, number>()

    sales.forEach(sale => {
      let key: string
      const date = new Date(sale.createdAt)

      if (groupBy === 'day') {
        key = format(date, 'yyyy-MM-dd')
      } else if (groupBy === 'week') {
        const weekStart = startOfDay(subDays(date, date.getDay()))
        key = format(weekStart, 'yyyy-MM-dd')
      } else {
        key = format(date, 'yyyy-MM')
      }

      const current = grouped.get(key) || 0
      grouped.set(key, current + Number(sale.total))
    })

    return Array.from(grouped.entries())
      .map(([date, value]) => ({
        date,
        value,
        label: format(new Date(date), groupBy === 'month' ? 'MMM yyyy' : 'dd/MM/yyyy')
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // Análisis de rentabilidad por producto
  static async getProductProfitability(
    organizationId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ProductProfitability[]> {
    const start = dateRange?.start || startOfMonth(new Date())
    const end = dateRange?.end || endOfMonth(new Date())

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          organizationId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            cost: true
          }
        }
      }
    })

    // Agrupar por producto
    const productMap = new Map<string, {
      productId: string
      productName: string
      totalRevenue: number
      totalCost: number
      unitsSold: number
      totalQuantity: number
    }>()

    saleItems.forEach(item => {
      const productId = item.productId
      const existing = productMap.get(productId) || {
        productId,
        productName: item.product?.name || 'Producto desconocido',
        totalRevenue: 0,
        totalCost: 0,
        unitsSold: 0,
        totalQuantity: 0
      }

      const revenue = Number(item.unitPrice) * Number(item.quantity)
      const cost = Number(item.product?.cost || 0) * Number(item.quantity)

      existing.totalRevenue += revenue
      existing.totalCost += cost
      existing.unitsSold += Number(item.quantity)
      existing.totalQuantity += 1

      productMap.set(productId, existing)
    })

    return Array.from(productMap.values())
      .map(product => {
        const profit = product.totalRevenue - product.totalCost
        const profitMargin = product.totalRevenue > 0
          ? (profit / product.totalRevenue) * 100
          : 0
        const averagePrice = product.unitsSold > 0
          ? product.totalRevenue / product.unitsSold
          : 0

        return {
          productId: product.productId,
          productName: product.productName,
          totalRevenue: product.totalRevenue,
          totalCost: product.totalCost,
          profit,
          profitMargin,
          unitsSold: product.unitsSold,
          averagePrice
        }
      })
      .sort((a, b) => b.profit - a.profit)
  }

  // Segmentación de clientes (RFM - Recency, Frequency, Monetary)
  static async getCustomerSegmentation(organizationId: string): Promise<CustomerSegment[]> {
    const now = new Date()
    const sixMonthsAgo = subMonths(now, 6)

    const customers = await prisma.salesCustomer.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        sales: {
          where: {
            createdAt: { gte: sixMonthsAgo },
            status: 'completed'
          },
          select: {
            total: true,
            createdAt: true
          }
        }
      }
    })

    const segments: CustomerSegment[] = [
      {
        segment: 'Campeones',
        count: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        description: 'Clientes con compras recientes, frecuentes y de alto valor'
      },
      {
        segment: 'Leales',
        count: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        description: 'Clientes frecuentes con compras regulares'
      },
      {
        segment: 'Potenciales',
        count: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        description: 'Clientes nuevos con potencial de crecimiento'
      },
      {
        segment: 'En Riesgo',
        count: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        description: 'Clientes que antes compraban pero han reducido su actividad'
      },
      {
        segment: 'Dormidos',
        count: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        description: 'Clientes inactivos que necesitan reactivación'
      }
    ]

    customers.forEach(customer => {
      const sales = customer.sales
      if (sales.length === 0) {
        segments[4].count++ // Dormidos
        return
      }

      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
      const avgOrderValue = totalRevenue / sales.length
      const lastPurchase = new Date(Math.max(...sales.map(s => new Date(s.createdAt).getTime())))
      const daysSinceLastPurchase = Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))

      // Calcular RFM
      const recency = daysSinceLastPurchase <= 30 ? 3 : daysSinceLastPurchase <= 90 ? 2 : 1
      const frequency = sales.length >= 10 ? 3 : sales.length >= 5 ? 2 : 1
      const monetary = totalRevenue >= 10000 ? 3 : totalRevenue >= 5000 ? 2 : 1

      const rfmScore = recency + frequency + monetary

      let segmentIndex = 0
      if (rfmScore >= 8) {
        segmentIndex = 0 // Campeones
      } else if (rfmScore >= 6) {
        segmentIndex = 1 // Leales
      } else if (recency === 3 && frequency <= 2) {
        segmentIndex = 2 // Potenciales
      } else if (recency === 2 || recency === 1) {
        segmentIndex = 3 // En Riesgo
      } else {
        segmentIndex = 4 // Dormidos
      }

      const segment = segments[segmentIndex]
      segment.count++
      segment.totalRevenue += totalRevenue
      segment.averageOrderValue = (segment.averageOrderValue * (segment.count - 1) + avgOrderValue) / segment.count
    })

    return segments.filter(s => s.count > 0)
  }

  // Predicción de ventas usando regresión lineal simple
  static async getSalesPredictions(
    organizationId: string,
    days: number = 30
  ): Promise<SalesPrediction[]> {
    // Obtener datos históricos de los últimos 90 días
    const historicalDays = 90
    const startDate = subDays(new Date(), historicalDays)
    const endDate = new Date()

    const sales = await prisma.sale.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed'
      },
      select: {
        createdAt: true,
        total: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Agrupar por día
    const dailySales = new Map<string, number>()
    sales.forEach(sale => {
      const date = format(new Date(sale.createdAt), 'yyyy-MM-dd')
      const current = dailySales.get(date) || 0
      dailySales.set(date, current + Number(sale.total))
    })

    const dataPoints = Array.from(dailySales.entries())
      .map(([date, value]) => ({
        date,
        value,
        dayIndex: Math.floor((new Date(date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.dayIndex - b.dayIndex)

    if (dataPoints.length < 7) {
      // No hay suficientes datos para hacer predicciones
      return []
    }

    // Regresión lineal simple: y = mx + b
    const n = dataPoints.length
    const sumX = dataPoints.reduce((sum, p) => sum + p.dayIndex, 0)
    const sumY = dataPoints.reduce((sum, p) => sum + p.value, 0)
    const sumXY = dataPoints.reduce((sum, p) => sum + p.dayIndex * p.value, 0)
    const sumXX = dataPoints.reduce((sum, p) => sum + p.dayIndex * p.dayIndex, 0)

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const b = (sumY - m * sumX) / n

    // Calcular desviación estándar para intervalos de confianza
    const meanY = sumY / n
    const variance = dataPoints.reduce((sum, p) => {
      const predicted = m * p.dayIndex + b
      return sum + Math.pow(p.value - predicted, 2)
    }, 0) / n
    const stdDev = Math.sqrt(variance)

    // Generar predicciones para los próximos días
    const predictions: SalesPrediction[] = []
    const lastDayIndex = dataPoints[dataPoints.length - 1].dayIndex

    for (let i = 1; i <= days; i++) {
      const futureDayIndex = lastDayIndex + i
      const predicted = m * futureDayIndex + b
      const confidence = Math.max(0.5, 1 - (i / days) * 0.5) // Disminuye con el tiempo
      const margin = stdDev * (1 - confidence)

      const futureDate = new Date(startDate)
      futureDate.setDate(futureDate.getDate() + futureDayIndex)

      predictions.push({
        date: format(futureDate, 'yyyy-MM-dd'),
        predicted: Math.max(0, predicted),
        confidence,
        lowerBound: Math.max(0, predicted - margin),
        upperBound: predicted + margin
      })
    }

    return predictions
  }
}

