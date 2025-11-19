/**
 * Servicio de historial de movimientos de inventario
 */

import { InventoryMovementType } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export interface CreateMovementData {
  organizationId: string
  productId: string
  branchId?: string
  movementType: InventoryMovementType
  quantity: number
  previousStock: number
  newStock: number
  referenceType?: string // 'sale', 'quotation', 'transfer', 'adjustment', 'manual'
  referenceId?: string
  notes?: string
  userId: string
}

export class InventoryMovementService {
  /**
   * Registrar un movimiento de inventario
   */
  static async createMovement(data: CreateMovementData) {
    try {
      const movement = await prisma.inventoryMovement.create({
        data: {
          organizationId: data.organizationId,
          productId: data.productId,
          branchId: data.branchId,
          movementType: data.movementType,
          quantity: data.quantity,
          previousStock: data.previousStock,
          newStock: data.newStock,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          userId: data.userId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      })

      logger.info('Movimiento de inventario registrado', {
        movementId: movement.id,
        productId: data.productId,
        movementType: data.movementType,
      })

      return movement
    } catch (error) {
      logger.error('Error registrando movimiento de inventario', error as Error, { data })
      throw error
    }
  }

  /**
   * Obtener historial de movimientos de un producto
   */
  static async getProductHistory(
    productId: string,
    options: {
      branchId?: string
      startDate?: Date
      endDate?: Date
      movementType?: InventoryMovementType
      limit?: number
      skip?: number
    } = {}
  ) {
    try {
      const where: any = {
        productId,
      }

      if (options.branchId) {
        where.branchId = options.branchId
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {}
        if (options.startDate) where.createdAt.gte = options.startDate
        if (options.endDate) where.createdAt.lte = options.endDate
      }

      if (options.movementType) {
        where.movementType = options.movementType
      }

      const [movements, total] = await Promise.all([
        prisma.inventoryMovement.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: options.limit || 100,
          skip: options.skip || 0,
        }),
        prisma.inventoryMovement.count({ where }),
      ])

      return {
        movements,
        total,
        page: Math.floor((options.skip || 0) / (options.limit || 100)) + 1,
        pageSize: options.limit || 100,
        totalPages: Math.ceil(total / (options.limit || 100)),
      }
    } catch (error) {
      logger.error('Error obteniendo historial de movimientos', error as Error, {
        productId,
        options,
      })
      throw error
    }
  }

  /**
   * Obtener historial de movimientos de una organización
   */
  static async getOrganizationHistory(
    organizationId: string,
    options: {
      branchId?: string
      productId?: string
      startDate?: Date
      endDate?: Date
      movementType?: InventoryMovementType
      limit?: number
      skip?: number
    } = {}
  ) {
    try {
      const where: any = {
        organizationId,
      }

      if (options.branchId) {
        where.branchId = options.branchId
      }

      if (options.productId) {
        where.productId = options.productId
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {}
        if (options.startDate) where.createdAt.gte = options.startDate
        if (options.endDate) where.createdAt.lte = options.endDate
      }

      if (options.movementType) {
        where.movementType = options.movementType
      }

      const [movements, total] = await Promise.all([
        prisma.inventoryMovement.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: options.limit || 100,
          skip: options.skip || 0,
        }),
        prisma.inventoryMovement.count({ where }),
      ])

      return {
        movements,
        total,
        page: Math.floor((options.skip || 0) / (options.limit || 100)) + 1,
        pageSize: options.limit || 100,
        totalPages: Math.ceil(total / (options.limit || 100)),
      }
    } catch (error) {
      logger.error('Error obteniendo historial de movimientos de organización', error as Error, {
        organizationId,
        options,
      })
      throw error
    }
  }
}

