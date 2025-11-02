import { prisma } from "@/lib/prisma"

export interface SalesReport {
  totalSales: number
  totalRevenue: number
  totalRefunded: number
  netRevenue: number
  byStatus: {
    completed: { count: number; amount: number }
    cancelled: { count: number; amount: number }
  }
  byPaymentMethod: {
    cash: { count: number; amount: number }
    card: { count: number; amount: number }
    transfer: { count: number; amount: number }
    qr: { count: number; amount: number }
  }
  topProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  topCustomers: Array<{
    customerId: string
    customerName: string
    totalPurchases: number
    totalSpent: number
  }>
  byDate: Array<{
    date: string
    count: number
    revenue: number
  }>
}

export interface ExpensesReport {
  totalExpenses: number
  totalAmount: number
  byCategory: Array<{
    category: string
    count: number
    amount: number
  }>
  byDate: Array<{
    date: string
    count: number
    amount: number
  }>
}

export interface ProductsReport {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalStockValue: number
  topSelling: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  byCategory: Array<{
    categoryId: string
    categoryName: string
    productCount: number
  }>
}

export interface CustomersReport {
  totalCustomers: number
  activeCustomers: number
  withPurchases: number
  withoutPurchases: number
  topCustomers: Array<{
    customerId: string
    customerName: string
    totalPurchases: number
    totalSpent: number
    lastPurchaseDate: Date | null
  }>
  byPurchaseCount: Array<{
    range: string
    count: number
  }>
}

export interface CashRegisterReport {
  totalCashRegisters: number
  openCashRegisters: number
  closedCashRegisters: number
  totalBalance: number
  totalOpenings: number
  totalClosings: number
  byBranch: Array<{
    branchId: string
    branchName: string
    cashRegisterCount: number
  }>
}

export interface GeneralReport {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  salesCount: number
  expensesCount: number
  quotationsCount: number
  productsCount: number
  customersCount: number
}

export class ReportsService {
  /**
   * Generar reporte de ventas
   */
  static async getSalesReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SalesReport> {
    const where: any = { organizationId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [sales, statusData, paymentData] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.sale.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { total: true }
      }),
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where,
        _count: true,
        _sum: { total: true }
      })
    ])

    // Calcular productos más vendidos
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += item.subtotal
        } else {
          productMap.set(item.productId, {
            name: item.product?.name || 'Producto desconocido',
            quantity: item.quantity,
            revenue: item.subtotal
          })
        }
      })
    })

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: Number(data.revenue)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calcular clientes principales
    const customerMap = new Map<string, { name: string; count: number; spent: number }>()
    sales.forEach(sale => {
      if (sale.customerId) {
        const existing = customerMap.get(sale.customerId)
        if (existing) {
          existing.count += 1
          existing.spent += Number(sale.total)
        } else {
          customerMap.set(sale.customerId, {
            name: sale.customer ? `${sale.customer.name} ${sale.customer.lastName || ''}`.trim() : 'Cliente',
            count: 1,
            spent: Number(sale.total)
          })
        }
      }
    })

    const topCustomers = Array.from(customerMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        customerName: data.name,
        totalPurchases: data.count,
        totalSpent: data.spent
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Agrupar por fecha
    const dateMap = new Map<string, { count: number; revenue: number }>()
    sales.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0]
      const existing = dateMap.get(dateStr)
      if (existing) {
        existing.count += 1
        existing.revenue += Number(sale.total)
      } else {
        dateMap.set(dateStr, {
          count: 1,
          revenue: Number(sale.total)
        })
      }
    })

    const byDate = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const refundedSales = sales.filter(s => s.status === 'cancelled')
    const totalRefunded = refundedSales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const netRevenue = totalRevenue - totalRefunded

    const byStatus = {
      completed: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 }
    }

    statusData.forEach(item => {
      if (item.status === 'completed') {
        byStatus.completed = {
          count: item._count,
          amount: Number(item._sum.total || 0)
        }
      } else if (item.status === 'cancelled') {
        byStatus.cancelled = {
          count: item._count,
          amount: Number(item._sum.total || 0)
        }
      }
    })

    const byPaymentMethod = {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      transfer: { count: 0, amount: 0 },
      qr: { count: 0, amount: 0 }
    }

    paymentData.forEach(item => {
      const method = item.paymentMethod || 'cash'
      if (method in byPaymentMethod) {
        byPaymentMethod[method as keyof typeof byPaymentMethod] = {
          count: item._count,
          amount: Number(item._sum.total || 0)
        }
      }
    })

    return {
      totalSales,
      totalRevenue,
      totalRefunded,
      netRevenue,
      byStatus,
      byPaymentMethod,
      topProducts,
      topCustomers,
      byDate
    }
  }

  /**
   * Generar reporte de gastos
   */
  static async getExpensesReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ExpensesReport> {
    const where: any = { organizationId }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const expenses = await prisma.expense.findMany({ where })
    const categoryData = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _count: true,
      _sum: { amount: true }
    })

    const totalExpenses = expenses.length
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    const byCategory = categoryData.map(item => ({
      category: item.category || 'Sin categoría',
      count: item._count,
      amount: Number(item._sum.amount || 0)
    })).sort((a, b) => b.amount - a.amount)

    const dateMap = new Map<string, { count: number; amount: number }>()
    expenses.forEach(expense => {
      const dateStr = expense.date.toISOString().split('T')[0]
      const existing = dateMap.get(dateStr)
      if (existing) {
        existing.count += 1
        existing.amount += Number(expense.amount)
      } else {
        dateMap.set(dateStr, {
          count: 1,
          amount: Number(expense.amount)
        })
      }
    })

    const byDate = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalExpenses,
      totalAmount,
      byCategory,
      byDate
    }
  }

  /**
   * Generar reporte de productos
   */
  static async getProductsReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProductsReport> {
    const products = await prisma.salesProduct.findMany({
      where: { organizationId },
      include: {
        category: true
      }
    })

    const totalProducts = products.length
    const activeProducts = products.filter(p => p.isActive).length
    const inactiveProducts = totalProducts - activeProducts
    const lowStockProducts = products.filter(p => Number(p.stock) < 10).length
    const outOfStockProducts = products.filter(p => Number(p.stock) <= 0).length
    const totalStockValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0)

    // Obtener productos más vendidos
    const where: any = { organizationId }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += item.subtotal
        } else {
          productMap.set(item.productId, {
            name: item.product?.name || 'Producto desconocido',
            quantity: item.quantity,
            revenue: item.subtotal
          })
        }
      })
    })

    const topSelling = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: Number(data.revenue)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Agrupar por categoría
    const categoryMap = new Map<string, { name: string; count: number }>()
    products.forEach(product => {
      const catId = product.categoryId || 'uncategorized'
      const catName = product.category?.name || 'Sin categoría'
      const existing = categoryMap.get(catId)
      if (existing) {
        existing.count += 1
      } else {
        categoryMap.set(catId, {
          name: catName,
          count: 1
        })
      }
    })

    const byCategory = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        productCount: data.count
      }))
      .sort((a, b) => b.productCount - a.productCount)

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      topSelling,
      byCategory
    }
  }

  /**
   * Generar reporte de clientes
   */
  static async getCustomersReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CustomersReport> {
    const customers = await prisma.salesCustomer.findMany({
      where: { organizationId }
    })

    const where: any = { organizationId }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalCustomers = customers.length
    const activeCustomers = customers.filter(c => c.isActive).length
    const customerIds = new Set(sales.map(s => s.customerId).filter(Boolean) as string[])
    const withPurchases = customerIds.size
    const withoutPurchases = totalCustomers - withPurchases

    const customerMap = new Map<string, {
      name: string
      count: number
      spent: number
      lastPurchase: Date | null
    }>()

    sales.forEach(sale => {
      if (sale.customerId) {
        const existing = customerMap.get(sale.customerId)
        if (existing) {
          existing.count += 1
          existing.spent += Number(sale.total)
          if (!existing.lastPurchase || sale.createdAt > existing.lastPurchase) {
            existing.lastPurchase = sale.createdAt
          }
        } else {
          customerMap.set(sale.customerId, {
            name: sale.customer ? `${sale.customer.name} ${sale.customer.lastName || ''}`.trim() : 'Cliente',
            count: 1,
            spent: Number(sale.total),
            lastPurchase: sale.createdAt
          })
        }
      }
    })

    const topCustomers = Array.from(customerMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        customerName: data.name,
        totalPurchases: data.count,
        totalSpent: data.spent,
        lastPurchaseDate: data.lastPurchase
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Clasificar por cantidad de compras
    const ranges = [
      { label: '1-5 compras', min: 1, max: 5 },
      { label: '6-10 compras', min: 6, max: 10 },
      { label: '11-20 compras', min: 11, max: 20 },
      { label: 'Más de 20 compras', min: 21, max: Infinity }
    ]

    const byPurchaseCount = ranges.map(range => ({
      range: range.label,
      count: Array.from(customerMap.values()).filter(c => c.count >= range.min && c.count <= range.max).length
    }))

    return {
      totalCustomers,
      activeCustomers,
      withPurchases,
      withoutPurchases,
      topCustomers,
      byPurchaseCount
    }
  }

  /**
   * Generar reporte de cajas
   */
  static async getCashRegisterReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CashRegisterReport> {
    const where: any = { organizationId }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const cashRegisters = await prisma.cashRegister.findMany({
      where,
      include: {
        branch: true
      }
    })

    const totalCashRegisters = cashRegisters.length
    const openCashRegisters = cashRegisters.filter(cr => cr.isOpen).length
    const closedCashRegisters = totalCashRegisters - openCashRegisters
    const totalBalance = cashRegisters.reduce((sum, cr) => sum + Number(cr.currentBalance), 0)

    const branchMap = new Map<string, { name: string; count: number }>()
    cashRegisters.forEach(cr => {
      const branchId = cr.branchId || 'nobranch'
      const branchName = cr.branch?.name || 'Sin sucursal'
      const existing = branchMap.get(branchId)
      if (existing) {
        existing.count += 1
      } else {
        branchMap.set(branchId, { name: branchName, count: 1 })
      }
    })

    const byBranch = Array.from(branchMap.entries())
      .map(([branchId, data]) => ({
        branchId,
        branchName: data.name,
        cashRegisterCount: data.count
      }))
      .sort((a, b) => b.cashRegisterCount - a.cashRegisterCount)

    // Contar aperturas y cierres
    const totalOpenings = cashRegisters.filter(cr => cr.openedById).length
    const totalClosings = cashRegisters.filter(cr => cr.closedById).length

    return {
      totalCashRegisters,
      openCashRegisters,
      closedCashRegisters,
      totalBalance,
      totalOpenings,
      totalClosings,
      byBranch
    }
  }

  /**
   * Generar reporte general
   */
  static async getGeneralReport(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GeneralReport> {
    const where: any = { organizationId }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [sales, expenses, quotations, products, customers] = await Promise.all([
      prisma.sale.findMany({ where }),
      prisma.expense.findMany({ where: { ...where, date: where.createdAt } }),
      prisma.quotation.findMany({ where }),
      prisma.salesProduct.findMany({ where: { organizationId } }),
      prisma.salesCustomer.findMany({ where: { organizationId } })
    ])

    const totalRevenue = sales
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + Number(s.total), 0)
    
    const totalRefunded = sales
      .filter(s => s.status === 'cancelled')
      .reduce((sum, s) => sum + Number(s.total), 0)
    
    const netRevenue = totalRevenue - totalRefunded
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netProfit = netRevenue - totalExpenses
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      salesCount: sales.length,
      expensesCount: expenses.length,
      quotationsCount: quotations.length,
      productsCount: products.length,
      customersCount: customers.length
    }
  }
}

