import { prisma } from '@/lib/prisma'
import { logDatabase, logBusinessOperation } from '@/lib/utils/logger'

export type NotificationType = 
  | 'stock_low'
  | 'new_sale'
  | 'new_quotation'
  | 'quotation_expired'
  | 'system'
  | 'expense_created'
  | 'cash_register_opened'
  | 'cash_register_closed'
  | 'user_created'
  | 'product_created'
  | 'transfer_request'

export interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  userId?: string
  usuarioSasId?: string
  organizationId?: string
  customerId?: string
  expiresAt?: Date
}

export interface NotificationFilters {
  userId?: string
  usuarioSasId?: string
  organizationId?: string
  customerId?: string
  type?: NotificationType
  isRead?: boolean
}

export class NotificationService {
  /**
   * Crear una notificación
   */
  static async createNotification(data: CreateNotificationData) {
    const startTime = Date.now()
    
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        userId: data.userId,
        usuarioSasId: data.usuarioSasId,
        organizationId: data.organizationId,
        expiresAt: data.expiresAt,
      },
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE', 'notifications', duration, undefined, {
      notificationId: notification.id,
      type: data.type,
    })

    logBusinessOperation('CREATE', 'Notification', notification.id, undefined, {
      type: data.type,
      title: data.title,
    })

    return notification
  }

  /**
   * Crear múltiples notificaciones (batch)
   */
  static async createNotifications(data: CreateNotificationData[]) {
    const startTime = Date.now()
    
    const notifications = await prisma.notification.createMany({
      data: data.map(d => ({
        type: d.type,
        title: d.title,
        message: d.message,
        data: d.data || {},
        userId: d.userId,
        usuarioSasId: d.usuarioSasId,
        organizationId: d.organizationId,
        customerId: d.customerId,
        expiresAt: d.expiresAt,
      })),
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE_MANY', 'notifications', duration, undefined, {
      count: notifications.count,
    })

    return notifications
  }

  /**
   * Obtener notificaciones con filtros
   */
  static async getNotifications(
    filters: NotificationFilters,
    skip: number = 0,
    take: number = 20
  ) {
    const where: any = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.usuarioSasId) {
      where.usuarioSasId = filters.usuarioSasId
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    // Excluir notificaciones expiradas
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ]

    const startTime = Date.now()
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ])

    const duration = Date.now() - startTime
    logDatabase('FIND_MANY', 'notifications', duration, undefined, {
      count: notifications.length,
      filters,
    })

    return { notifications, total }
  }

  /**
   * Obtener notificaciones no leídas
   */
  static async getUnreadNotifications(filters: NotificationFilters) {
    return this.getNotifications({ ...filters, isRead: false }, 0, 100)
  }

  /**
   * Marcar notificación como leída
   */
  static async markAsRead(notificationId: string) {
    const startTime = Date.now()
    
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'notifications', duration, undefined, {
      notificationId,
      action: 'mark_as_read',
    })

    return notification
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  static async markAllAsRead(filters: NotificationFilters) {
    const where: any = {}
    where.isRead = false

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.usuarioSasId) {
      where.usuarioSasId = filters.usuarioSasId
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    const startTime = Date.now()
    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    const duration = Date.now() - startTime
    logDatabase('UPDATE_MANY', 'notifications', duration, undefined, {
      count: result.count,
      action: 'mark_all_as_read',
    })

    return result
  }

  /**
   * Eliminar notificación
   */
  static async deleteNotification(notificationId: string) {
    const startTime = Date.now()
    
    await prisma.notification.delete({
      where: { id: notificationId },
    })

    const duration = Date.now() - startTime
    logDatabase('DELETE', 'notifications', duration, undefined, {
      notificationId,
    })
  }

  /**
   * Limpiar notificaciones expiradas (debe ejecutarse periódicamente)
   */
  static async cleanupExpiredNotifications() {
    const startTime = Date.now()
    
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    const duration = Date.now() - startTime
    logDatabase('DELETE_MANY', 'notifications', duration, undefined, {
      count: result.count,
      action: 'cleanup_expired',
    })

    return result
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  static async getUnreadCount(filters: NotificationFilters): Promise<number> {
    const where: any = {
      isRead: false,
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.usuarioSasId) {
      where.usuarioSasId = filters.usuarioSasId
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    // Excluir expiradas
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ]

    return prisma.notification.count({ where })
  }

  /**
   * Helpers para crear notificaciones comunes
   */
  static async notifyStockLow(
    organizationId: string,
    productId: string,
    productName: string,
    currentStock: number,
    minStock: number,
    customerId?: string
  ) {
    return this.createNotification({
      type: 'stock_low',
      title: 'Stock Bajo',
      message: `El producto "${productName}" tiene stock bajo (${currentStock}). Stock mínimo: ${minStock}`,
      data: {
        productId,
        productName,
        currentStock,
        minStock,
        url: customerId ? `/${customerId}/productos` : `/productos`,
      },
      organizationId,
      customerId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    })
  }

  static async notifyNewSale(
    organizationId: string,
    saleId: string,
    saleNumber: string,
    total: number,
    customerName?: string
  ) {
    return this.createNotification({
      type: 'new_sale',
      title: 'Nueva Venta',
      message: `Nueva venta ${saleNumber}${customerName ? ` - ${customerName}` : ''} por $${total.toFixed(2)}`,
      data: {
        saleId,
        saleNumber,
        total,
        customerName,
        url: `/ventas/${saleId}`,
      },
      organizationId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    })
  }

  static async notifyNewQuotation(
    organizationId: string,
    quotationId: string,
    quotationNumber: string,
    total: number,
    customerName?: string
  ) {
    return this.createNotification({
      type: 'new_quotation',
      title: 'Nueva Cotización',
      message: `Nueva cotización ${quotationNumber}${customerName ? ` - ${customerName}` : ''} por $${total.toFixed(2)}`,
      data: {
        quotationId,
        quotationNumber,
        total,
        customerName,
        url: `/cotizaciones/${quotationId}`,
      },
      organizationId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    })
  }

  /**
   * Enviar notificación masiva a todos los usuarios admin
   */
  static async sendBulkToAllAdmins(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    expiresAt?: Date
  ) {
    const startTime = Date.now()

    // Obtener todos los usuarios admin activos
    const adminUsers = await prisma.profile.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    if (adminUsers.length === 0) {
      return { count: 0 }
    }

    // Crear notificaciones para todos los usuarios admin
    const notifications = adminUsers.map((user) => ({
      type,
      title,
      message,
      data: data || {},
      userId: user.id,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
    }))

    const result = await prisma.notification.createMany({
      data: notifications,
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE_MANY', 'notifications', duration, undefined, {
      count: result.count,
      type: 'bulk_admin',
    })

    logBusinessOperation('CREATE_MANY', 'Notification', undefined, undefined, {
      type: 'bulk_admin',
      count: result.count,
      title,
    })

    return result
  }

  /**
   * Enviar notificación masiva a todos los usuarios de una organización
   */
  static async sendBulkToOrganization(
    organizationId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    expiresAt?: Date
  ) {
    const startTime = Date.now()

    // Obtener todos los usuarios SAS de la organización
    const orgUsers = await prisma.usuarioSas.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    if (orgUsers.length === 0) {
      return { count: 0 }
    }

    // Crear notificaciones para todos los usuarios de la organización
    const notifications = orgUsers.map((user) => ({
      type,
      title,
      message,
      data: data || {},
      usuarioSasId: user.id,
      organizationId,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
    }))

    const result = await prisma.notification.createMany({
      data: notifications,
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE_MANY', 'notifications', duration, undefined, {
      count: result.count,
      type: 'bulk_organization',
      organizationId,
    })

    logBusinessOperation('CREATE_MANY', 'Notification', undefined, undefined, {
      type: 'bulk_organization',
      count: result.count,
      organizationId,
      title,
    })

    return result
  }

  /**
   * Enviar notificación masiva a múltiples organizaciones
   */
  static async sendBulkToOrganizations(
    organizationIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    expiresAt?: Date
  ) {
    const startTime = Date.now()

    if (organizationIds.length === 0) {
      return { count: 0 }
    }

    // Obtener todos los usuarios SAS de las organizaciones especificadas
    const orgUsers = await prisma.usuarioSas.findMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        organizationId: true,
      },
    })

    if (orgUsers.length === 0) {
      return { count: 0 }
    }

    // Crear notificaciones para todos los usuarios de las organizaciones
    const notifications = orgUsers.map((user) => ({
      type,
      title,
      message,
      data: data || {},
      usuarioSasId: user.id,
      organizationId: user.organizationId,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
    }))

    const result = await prisma.notification.createMany({
      data: notifications,
    })

    const duration = Date.now() - startTime
    logDatabase('CREATE_MANY', 'notifications', duration, undefined, {
      count: result.count,
      type: 'bulk_organizations',
      organizationCount: organizationIds.length,
    })

    logBusinessOperation('CREATE_MANY', 'Notification', undefined, undefined, {
      type: 'bulk_organizations',
      count: result.count,
      organizationCount: organizationIds.length,
      title,
    })

    return result
  }

  /**
   * Enviar notificación masiva a usuarios específicos (admin o SAS)
   */
  static async sendBulkToUsers(
    userIds: string[],
    usuarioSasIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    expiresAt?: Date
  ) {
    const startTime = Date.now()

    const notifications: CreateNotificationData[] = []

    // Agregar notificaciones para usuarios admin
    if (userIds.length > 0) {
      const adminNotifications = userIds.map((userId) => ({
        type,
        title,
        message,
        data: data || {},
        userId,
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }))
      notifications.push(...adminNotifications)
    }

    // Agregar notificaciones para usuarios SAS
    if (usuarioSasIds.length > 0) {
      // Obtener información de las organizaciones de los usuarios SAS
      const sasUsers = await prisma.usuarioSas.findMany({
        where: {
          id: {
            in: usuarioSasIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          organizationId: true,
        },
      })

      const sasNotifications = sasUsers.map((user) => ({
        type,
        title,
        message,
        data: data || {},
        usuarioSasId: user.id,
        organizationId: user.organizationId,
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }))
      notifications.push(...sasNotifications)
    }

    if (notifications.length === 0) {
      return { count: 0 }
    }

    const result = await this.createNotifications(notifications)

    const duration = Date.now() - startTime
    logDatabase('CREATE_MANY', 'notifications', duration, undefined, {
      count: result.count,
      type: 'bulk_users',
      userIdCount: userIds.length,
      usuarioSasCount: usuarioSasIds.length,
    })

    logBusinessOperation('CREATE_MANY', 'Notification', undefined, undefined, {
      type: 'bulk_users',
      count: result.count,
      title,
    })

    return result
  }
}

