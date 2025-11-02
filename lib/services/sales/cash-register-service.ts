import { prisma } from '@/lib/prisma'
import { CashRegister } from '@prisma/client'
import { CommonIncludes } from '@/lib/utils/query-optimizer'
import { logDatabase } from '@/lib/utils/logger'

export interface CreateCashRegisterData {
  name: string
  branchId?: string
  openingBalance?: number
  openedById?: string
}

export interface UpdateCashRegisterData {
  name?: string
  branchId?: string
  openingBalance?: number
  currentBalance?: number
  isOpen?: boolean
  openedById?: string | null
  closedById?: string | null
}

export class CashRegisterService {
  // Obtener todas las cajas de una organización
  static async getAllCashRegisters(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    branchId?: string,
    isOpen?: boolean
  ) {
    const where: any = {
      organizationId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (branchId) {
      where.branchId = branchId
    }

    if (isOpen !== undefined) {
      where.isOpen = isOpen
    }

    const startTime = Date.now()
    const [cashRegisters, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        skip,
        take,
        include: CommonIncludes.cashRegister, // Usar include optimizado
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cashRegister.count({ where })
    ])
    
    const duration = Date.now() - startTime
    logDatabase('FIND_MANY', 'cash_registers', duration, undefined, {
      organizationId,
      count: cashRegisters.length,
    })

    return { cashRegisters, total }
  }

  // Obtener caja por ID
  static async getCashRegisterById(id: string): Promise<CashRegister | null> {
    const startTime = Date.now()
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: CommonIncludes.cashRegister, // Usar include optimizado
    })
    
    const duration = Date.now() - startTime
    logDatabase('FIND_UNIQUE', 'cash_registers', duration, undefined, {
      cashRegisterId: id,
    })
    
    return cashRegister
  }

  // Crear nueva caja
  static async createCashRegister(
    organizationId: string,
    data: CreateCashRegisterData
  ): Promise<CashRegister> {
    const openingBalance = data.openingBalance || 0
    const openedAt = new Date()
    return prisma.cashRegister.create({
      data: {
        organizationId,
        name: data.name,
        branchId: data.branchId,
        openingBalance,
        currentBalance: openingBalance,
        isOpen: true,
        lastOpenAt: openedAt,
        openedById: data.openedById || null,
        closedById: null,
        lastCloseAt: null
      },
      include: CommonIncludes.cashRegister, // Usar include optimizado
    })
  }

  // Actualizar caja
  static async updateCashRegister(
    id: string,
    data: UpdateCashRegisterData
  ): Promise<CashRegister> {
    const startTime = Date.now()
    const updated = await prisma.cashRegister.update({
      where: { id },
      data,
      include: CommonIncludes.cashRegister, // Usar include optimizado
    })
    
    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'cash_registers', duration, undefined, {
      cashRegisterId: id,
    })
    
    return updated
  }

  // Eliminar caja
  static async deleteCashRegister(id: string): Promise<void> {
    await prisma.cashRegister.delete({
      where: { id }
    })
  }

  // Abrir caja
  static async openCashRegister(id: string, openingBalance: number, userId: string): Promise<CashRegister> {
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id }
    })

    if (!cashRegister) {
      throw new Error('Caja no encontrada')
    }

    if (cashRegister.isOpen) {
      throw new Error('La caja ya está abierta')
    }

    const openedAt = new Date()

    return prisma.cashRegister.update({
      where: { id },
      data: {
        isOpen: true,
        openingBalance,
        currentBalance: openingBalance,
        lastOpenAt: openedAt,
        openedById: userId,
        closedById: null,
        lastCloseAt: null
      },
      include: CommonIncludes.cashRegister, // Usar include optimizado
    })
  }

  // Cerrar caja
  static async closeCashRegister(id: string, userId: string): Promise<CashRegister> {
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id }
    })

    if (!cashRegister) {
      throw new Error('Caja no encontrada')
    }

    if (!cashRegister.isOpen) {
      throw new Error('La caja ya está cerrada')
    }

    return prisma.cashRegister.update({
      where: { id },
      data: {
        isOpen: false,
        lastCloseAt: new Date(),
        closedById: userId
      },
      include: CommonIncludes.cashRegister, // Usar include optimizado
    })
  }

  // Actualizar balance actual (usado cuando hay movimientos)
  static async updateBalance(id: string, amount: number): Promise<CashRegister> {
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id }
    })

    if (!cashRegister) {
      throw new Error('Caja no encontrada')
    }

    if (!cashRegister.isOpen) {
      throw new Error('La caja debe estar abierta para actualizar el balance')
    }

    return prisma.cashRegister.update({
      where: { id },
      data: {
        currentBalance: {
          increment: amount
        }
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // Obtener estadísticas de cajas
  static async getCashRegisterStats(organizationId: string) {
    const [total, open, closed, totalBalance] = await Promise.all([
      prisma.cashRegister.count({ where: { organizationId } }),
      prisma.cashRegister.count({ where: { organizationId, isOpen: true } }),
      prisma.cashRegister.count({ where: { organizationId, isOpen: false } }),
      prisma.cashRegister.aggregate({
        where: { organizationId, isOpen: true },
        _sum: { currentBalance: true }
      })
    ])

    return {
      total,
      open,
      closed,
      totalBalance: Number(totalBalance._sum.currentBalance || 0)
    }
  }
}

