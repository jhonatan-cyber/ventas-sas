import { prisma } from '@/lib/prisma'
import { Expense } from '@prisma/client'
import { 
  CursorPaginationOptions, 
  CursorPaginationResult, 
  buildCursorWhere,
  createCursorResponse 
} from '@/lib/utils/pagination'
import { CommonIncludes } from '@/lib/utils/query-optimizer'

export interface CreateExpenseData {
  userId: string
  name: string
  amount: number
  description: string
  date: Date
  branchId?: string | null
  category?: string | null
}

export interface UpdateExpenseData {
  userId?: string
  name?: string
  amount?: number
  description?: string
  date?: Date
  branchId?: string | null
  category?: string | null
}

export class ExpenseService {
  // Obtener todos los gastos de una organización
  static async getAllExpenses(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    branchId?: string | null,
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    category?: string,
  ) {
    const where: any = {
      organizationId
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (branchId === null) {
      where.branchId = null
    } else if (branchId) {
      where.branchId = branchId
    }

    if (userId) {
      where.userId = userId
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate
      }
      if (endDate) {
        where.date.lte = endDate
      }
    }

    // Optimizado: usar include común para evitar N+1
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        include: CommonIncludes.expense,
        orderBy: { date: 'desc' }
      }),
      prisma.expense.count({ where })
    ])

    return { expenses, total }
  }

  /**
   * Obtener gastos con paginación cursor-based (optimizada)
   */
  static async getExpensesCursor(
    organizationId: string,
    options: CursorPaginationOptions & {
      search?: string
      branchId?: string | null
      startDate?: Date
      endDate?: Date
      userId?: string
      category?: string
    }
  ): Promise<CursorPaginationResult<Expense & { user?: any; branch?: any }>> {
    const { limit = 20, cursor, search, branchId, startDate, endDate, userId, category } = options

    const where: any = {
      organizationId,
      ...buildCursorWhere(cursor, 'date', 'desc'),
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (branchId === null) {
      where.branchId = null
    } else if (branchId) {
      where.branchId = branchId
    }

    if (userId) {
      where.userId = userId
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {
        ...where.date,
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      take: limit + 1,
      include: CommonIncludes.expense,
      orderBy: { date: 'desc' },
    })

    return createCursorResponse(expenses, 'date', limit)
  }

  // Obtener gasto por ID
  static async getExpenseById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
        organization: true
      }
    })
  }

  // Crear nuevo gasto
  static async createExpense(
    organizationId: string,
    data: CreateExpenseData
  ): Promise<Expense> {
    // Verificar si el userId existe en SalesUser
    let salesUserId = data.userId
    
    // Si el userId es de UsuarioSas, buscar o crear el SalesUser correspondiente
    const usuarioSas = await prisma.usuarioSas.findUnique({
      where: { id: data.userId },
      include: { customer: true }
    })

    const branchProvided = Object.prototype.hasOwnProperty.call(data, "branchId")
    let branchId = data.branchId ?? null

    if (usuarioSas) {
      // Buscar si ya existe un SalesUser con el mismo correo o crearlo
      let salesUser = await prisma.salesUser.findFirst({
        where: {
          organizationId,
          email: usuarioSas.correo || `${usuarioSas.nombre.toLowerCase()}.${usuarioSas.apellido.toLowerCase()}@temp.com`
        }
      })

      if (!salesUser) {
        // Crear SalesUser desde UsuarioSas
        salesUser = await prisma.salesUser.create({
          data: {
            organizationId,
            email: usuarioSas.correo || `${usuarioSas.nombre.toLowerCase()}.${usuarioSas.apellido.toLowerCase()}@temp.com`,
            password: usuarioSas.contraseña || 'temp',
            fullName: `${usuarioSas.nombre} ${usuarioSas.apellido}`,
            isActive: usuarioSas.isActive
          }
        })
      }
      salesUserId = salesUser.id

      if (!branchProvided && !branchId && usuarioSas.sucursalId) {
        branchId = usuarioSas.sucursalId
      }
    }

    return prisma.expense.create({
      data: {
        organizationId,
        userId: salesUserId,
        name: data.name,
        category: data.category ?? null,
        description: data.description,
        amount: data.amount,
        date: data.date,
        branchId
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })
  }

  // Actualizar gasto
  static async updateExpense(
    id: string,
    data: UpdateExpenseData
  ): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })
  }

  // Eliminar gasto
  static async deleteExpense(id: string): Promise<void> {
    await prisma.expense.delete({
      where: { id }
    })
  }

  // Obtener estadísticas de gastos
  static async getExpenseStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { organizationId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    const [totalExpenses, totalAmount, thisMonthExpenses, thisMonthAmount] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.expense.count({
        where: {
          ...where,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.expense.aggregate({
        where: {
          ...where,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      })
    ])

    return {
      totalExpenses,
      totalAmount: Number(totalAmount._sum.amount || 0),
      thisMonthExpenses,
      thisMonthAmount: Number(thisMonthAmount._sum.amount || 0)
    }
  }
}

