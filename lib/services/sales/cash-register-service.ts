import { prisma } from '@/lib/prisma'
import { CashRegister } from '@prisma/client'

export interface CreateCashRegisterData {
  name: string
  branchId?: string
  openingBalance?: number
}

export interface UpdateCashRegisterData {
  name?: string
  branchId?: string
  openingBalance?: number
  currentBalance?: number
  isOpen?: boolean
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

    const [cashRegisters, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        skip,
        take,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cashRegister.count({ where })
    ])

    return { cashRegisters, total }
  }

  // Obtener caja por ID
  static async getCashRegisterById(id: string): Promise<CashRegister | null> {
    return prisma.cashRegister.findUnique({
      where: { id },
      include: {
        branch: true,
        organization: true
      }
    })
  }

  // Crear nueva caja
  static async createCashRegister(
    organizationId: string,
    data: CreateCashRegisterData
  ): Promise<CashRegister> {
    return prisma.cashRegister.create({
      data: {
        organizationId,
        name: data.name,
        branchId: data.branchId,
        openingBalance: data.openingBalance || 0,
        currentBalance: data.openingBalance || 0,
        isOpen: false
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

  // Actualizar caja
  static async updateCashRegister(
    id: string,
    data: UpdateCashRegisterData
  ): Promise<CashRegister> {
    return prisma.cashRegister.update({
      where: { id },
      data,
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

  // Eliminar caja
  static async deleteCashRegister(id: string): Promise<void> {
    await prisma.cashRegister.delete({
      where: { id }
    })
  }

  // Abrir caja
  static async openCashRegister(id: string, openingBalance: number): Promise<CashRegister> {
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id }
    })

    if (!cashRegister) {
      throw new Error('Caja no encontrada')
    }

    if (cashRegister.isOpen) {
      throw new Error('La caja ya está abierta')
    }

    return prisma.cashRegister.update({
      where: { id },
      data: {
        isOpen: true,
        openingBalance,
        currentBalance: openingBalance,
        lastOpenAt: new Date()
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

  // Cerrar caja
  static async closeCashRegister(id: string): Promise<CashRegister> {
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
        lastCloseAt: new Date()
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

