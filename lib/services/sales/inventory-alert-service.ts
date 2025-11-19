/**
 * Servicio de alertas de stock bajo automáticas
 */

import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import { logger } from '@/lib/utils/logger'

export interface LowStockAlert {
  productId: string
  productName: string
  currentStock: number
  minStock: number
  reorderPoint: number | null
  branchId?: string | null
  branchName?: string | null
  organizationId: string
}

export class InventoryAlertService {
  /**
   * Verificar productos con stock bajo y generar alertas
   */
  static async checkLowStock(organizationId: string): Promise<LowStockAlert[]> {
    try {
      const products = await prisma.salesProduct.findMany({
        where: {
          organizationId,
          deletedAt: null,
          isActive: true,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      const alerts: LowStockAlert[] = []

      for (const product of products) {
        const minStock = product.minStock || 0
        const reorderPoint = product.reorderPoint || minStock
        const currentStock = product.stock

        // Verificar si el stock está por debajo del punto de reorden o del stock mínimo
        if (currentStock <= reorderPoint || currentStock <= minStock) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            currentStock,
            minStock,
            reorderPoint,
            branchId: product.branchId || null,
            branchName: product.branch?.name || null,
            organizationId,
          })
        }
      }

      return alerts
    } catch (error) {
      logger.error('Error verificando stock bajo', error as Error, { organizationId })
      return []
    }
  }

  /**
   * Generar notificaciones para productos con stock bajo
   */
  static async generateLowStockNotifications(organizationId: string): Promise<number> {
    try {
      const alerts = await this.checkLowStock(organizationId)

      if (alerts.length === 0) {
        return 0
      }

      // Obtener usuarios administradores de la organización
      const adminUsers = await prisma.usuarioSas.findMany({
        where: {
          organizationId,
          isActive: true,
          rol: {
            nombre: {
              contains: 'administrador',
              mode: 'insensitive',
            },
          },
        },
        select: {
          id: true,
        },
      })

      const notifications = []

      for (const alert of alerts) {
        const message = alert.branchName
          ? `El producto "${alert.productName}" en ${alert.branchName} tiene stock bajo (${alert.currentStock}). Stock mínimo: ${alert.minStock}`
          : `El producto "${alert.productName}" tiene stock bajo (${alert.currentStock}). Stock mínimo: ${alert.minStock}`

        // Crear notificación para cada administrador
        for (const user of adminUsers) {
          notifications.push({
            type: 'stock_low' as const,
            title: 'Stock Bajo',
            message,
            organizationId,
            userId: user.id,
            data: {
              productId: alert.productId,
              productName: alert.productName,
              currentStock: alert.currentStock,
              minStock: alert.minStock,
              reorderPoint: alert.reorderPoint,
              branchId: alert.branchId,
              branchName: alert.branchName,
            },
          })
        }
      }

      if (notifications.length > 0) {
        await NotificationService.createNotifications(notifications)
        logger.info(`Notificaciones de stock bajo generadas: ${notifications.length}`, {
          organizationId,
          alertsCount: alerts.length,
        })
      }

      return notifications.length
    } catch (error) {
      logger.error('Error generando notificaciones de stock bajo', error as Error, {
        organizationId,
      })
      return 0
    }
  }

  /**
   * Verificar stock bajo para todas las organizaciones activas
   */
  static async checkAllOrganizations(): Promise<void> {
    try {
      const organizations = await prisma.organization.findMany({
        where: {
          subscriptionStatus: 'active',
        },
        select: {
          id: true,
        },
      })

      for (const org of organizations) {
        await this.generateLowStockNotifications(org.id)
      }

      logger.info(`Verificación de stock bajo completada para ${organizations.length} organizaciones`)
    } catch (error) {
      logger.error('Error verificando stock bajo para todas las organizaciones', error as Error)
    }
  }
}

