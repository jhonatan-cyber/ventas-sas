import { prisma } from '@/lib/prisma'
import { Expense } from '@prisma/client'

export interface CreateExpenseData {
  userId: string
  category: string
  description: string
  amount: number
  date: Date
}

export interface UpdateExpenseData {
  userId?: string
  category?: string
  description?: string
  amount?: number
  date?: Date
}

export class ExpenseService {
  // Obtener todos los gastos de una organización
  static async getAllExpenses(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ) {
    const where: any = {
      organizationId
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (userId) {
      where.userId = userId
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

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.expense.count({ where })
    ])

    return { expenses, total }
  }

  // Obtener gasto por ID
  static async getExpenseById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        user: true,
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
    }

    return prisma.expense.create({
      data: {
        organizationId,
        userId: salesUserId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
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

  // Obtener categorías de gastos únicas
  static async getCategories(organizationId: string): Promise<string[]> {
    const expenses = await prisma.expense.findMany({
      where: { organizationId },
      select: { category: true },
      distinct: ['category']
    })

    return expenses.map(e => e.category)
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

