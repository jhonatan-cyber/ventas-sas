/**
 * Servicio de ajustes de inventario con justificación
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { AdjustmentType, InventoryMovementType } from '@prisma/client'
import { InventoryMovementService } from './inventory-movement-service'

export interface CreateAdjustmentData {
  organizationId: string
  productId: string
  branchId?: string
  adjustmentType: AdjustmentType
  quantity: number
  reason: string
  justification: string
  notes?: string
  userId: string
}

export class InventoryAdjustmentService {
  /**
   * Asegura que exista un SalesUser asociado a un UsuarioSas
   * Devuelve el ID del SalesUser (creándolo si es necesario)
   */
  private static async getOrCreateSalesUserFromSasUser(
    organizationId: string,
    usuarioSasId: string
  ) {
    const usuarioSas = await prisma.usuarioSas.findFirst({
      where: {
        id: usuarioSasId,
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        organizationId: true,
      },
    })

    if (!usuarioSas) {
      throw new Error('Usuario inválido para la organización')
    }

    let salesUser = await prisma.salesUser.findFirst({
      where: {
        organizationId,
        email: usuarioSas.email || undefined,
        isActive: true,
      },
      select: { id: true },
    })

    if (!salesUser) {
      const fullName = `${usuarioSas.nombre} ${usuarioSas.apellido}`.trim()

      salesUser = await prisma.salesUser.create({
        data: {
          organizationId,
          email: usuarioSas.email || `sas-user-${usuarioSas.id}@local`,
          password: '!',
          fullName: fullName || 'Usuario SAS',
          isActive: true,
        },
        select: { id: true },
      })
    }

    return salesUser.id
  }

  /**
   * Crear un ajuste de inventario
   */
  static async createAdjustment(data: CreateAdjustmentData) {
    try {
      // Validar que la organización existe
      const organization = await prisma.organization.findUnique({
        where: { id: data.organizationId },
      })

      if (!organization) {
        throw new Error('Organización no encontrada')
      }

      // Convertir UsuarioSas a SalesUser (crear si no existe)
      const salesUserId = await this.getOrCreateSalesUserFromSasUser(
        data.organizationId,
        data.userId
      )

      // Validar que la sucursal existe (si se proporciona)
      if (data.branchId) {
        const branch = await prisma.branch.findFirst({
          where: {
            id: data.branchId,
            organizationId: data.organizationId,
            deletedAt: null,
          },
        })

        if (!branch) {
          throw new Error('Sucursal no encontrada')
        }
      }

      // Verificar que el producto existe
      const product = await prisma.salesProduct.findFirst({
        where: {
          id: data.productId,
          organizationId: data.organizationId,
          ...(data.branchId ? { branchId: data.branchId } : {}),
          deletedAt: null,
        },
      })

      if (!product) {
        throw new Error('Producto no encontrado')
      }

      const previousStock = product.stock
      let newStock: number

      // Calcular nuevo stock según el tipo de ajuste
      if (data.adjustmentType === AdjustmentType.INCREASE) {
        newStock = previousStock + data.quantity
      } else if (data.adjustmentType === AdjustmentType.DECREASE) {
        if (previousStock < data.quantity) {
          throw new Error(`Stock insuficiente. Stock actual: ${previousStock}, cantidad a reducir: ${data.quantity}`)
        }
        newStock = previousStock - data.quantity
      } else {
        // CORRECTION - establecer stock directamente
        newStock = data.quantity
      }

      // Realizar el ajuste en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Actualizar stock del producto
        await tx.salesProduct.update({
          where: { id: data.productId },
          data: { stock: newStock },
        })

        // Crear registro de ajuste
        const adjustment = await tx.inventoryAdjustment.create({
          data: {
            organizationId: data.organizationId,
            productId: data.productId,
            branchId: data.branchId,
            adjustmentType: data.adjustmentType,
            quantity: data.adjustmentType === AdjustmentType.CORRECTION
              ? newStock - previousStock
              : data.quantity,
            previousStock,
            newStock,
            reason: data.reason,
            justification: data.justification,
            notes: data.notes,
            userId: salesUserId,
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

        // Registrar movimiento de inventario
        const movementQuantity =
          data.adjustmentType === AdjustmentType.CORRECTION
            ? newStock - previousStock
            : data.adjustmentType === AdjustmentType.INCREASE
              ? data.quantity
              : -data.quantity

        await InventoryMovementService.createMovement({
          organizationId: data.organizationId,
          productId: data.productId,
          branchId: data.branchId,
          movementType: InventoryMovementType.ADJUSTMENT,
          quantity: movementQuantity,
          previousStock,
          newStock,
          referenceType: 'adjustment',
          referenceId: adjustment.id,
          notes: `${data.reason}: ${data.justification}`,
          userId: salesUserId,
        })

        return adjustment
      })

      logger.info('Ajuste de inventario creado', {
        adjustmentId: result.id,
        productId: data.productId,
        adjustmentType: data.adjustmentType,
        previousStock,
        newStock,
      })

      return result
    } catch (error) {
      logger.error('Error creando ajuste de inventario', error as Error, { data })
      throw error
    }
  }

  /**
   * Obtener ajustes de una organización
   */
  static async getAdjustments(
    organizationId: string,
    options: {
      branchId?: string
      productId?: string
      adjustmentType?: AdjustmentType
      startDate?: Date
      endDate?: Date
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

      if (options.adjustmentType) {
        where.adjustmentType = options.adjustmentType
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {}
        if (options.startDate) where.createdAt.gte = options.startDate
        if (options.endDate) where.createdAt.lte = options.endDate
      }

      const [adjustments, total] = await Promise.all([
        prisma.inventoryAdjustment.findMany({
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
        prisma.inventoryAdjustment.count({ where }),
      ])

      return {
        adjustments,
        total,
        page: Math.floor((options.skip || 0) / (options.limit || 100)) + 1,
        pageSize: options.limit || 100,
        totalPages: Math.ceil(total / (options.limit || 100)),
      }
    } catch (error) {
      logger.error('Error obteniendo ajustes de inventario', error as Error, {
        organizationId,
        options,
      })
      throw error
    }
  }
}

