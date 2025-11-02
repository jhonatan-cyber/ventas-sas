import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

/**
 * Tipos de eventos de seguridad
 */
export type SecurityLogType =
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'SENSITIVE_DATA_ACCESSED'
  | 'DATA_EXPORTED'
  | 'BULK_DELETE'
  | 'SETTINGS_CHANGED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_CHANGED'
  | 'PAYMENT_PROCESSED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'TWO_FACTOR_SETUP_INITIATED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'TWO_FACTOR_VERIFY_FAILED'
  | 'TWO_FACTOR_BACKUP_CODE_USED'
  | 'TWO_FACTOR_DISABLE_FAILED'

export interface LoginAttemptData {
  userId?: string
  customerId?: string
  organizationId?: string
  method: 'CI' | 'email' | 'username'
  identifier?: string // CI, email, o username usado
  success: boolean
  errorMessage?: string
}

export interface SensitiveActionData {
  userId: string
  customerId?: string
  organizationId?: string
  actionType: SecurityLogType
  entityType?: string // Tipo de entidad afectada (Product, Sale, etc.)
  entityId?: string // ID de la entidad afectada
  details?: Record<string, any>
}

export interface RequestMetadata {
  ip?: string
  userAgent?: string
  referer?: string
}

/**
 * Servicio para logging de seguridad y auditoría
 */
export class SecurityAuditLogger {
  /**
   * Extrae metadatos de la request
   */
  private static getRequestMetadata(request?: NextRequest): RequestMetadata {
    if (!request) {
      return {}
    }

    return {
      ip: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || undefined,
    }
  }

  /**
   * Registra un intento de login
   */
  static async logLoginAttempt(
    data: LoginAttemptData,
    request?: NextRequest
  ): Promise<void> {
    try {
      const metadata = this.getRequestMetadata(request)

      await prisma.securityLog.create({
        data: {
          type: data.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
          userId: data.userId,
          customerId: data.customerId,
          organizationId: data.organizationId,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
          details: {
            method: data.method,
            identifier: data.identifier,
            referer: metadata.referer,
          },
          success: data.success,
          errorMessage: data.errorMessage,
        },
      })
    } catch (error) {
      // No fallar la aplicación si el logging falla
      console.error('[SecurityAuditLogger] Error logging login attempt:', error)
    }
  }

  /**
   * Registra una acción sensible
   */
  static async logSensitiveAction(
    data: SensitiveActionData,
    request?: NextRequest
  ): Promise<void> {
    try {
      const metadata = this.getRequestMetadata(request)

      await prisma.securityLog.create({
        data: {
          type: data.actionType,
          userId: data.userId,
          customerId: data.customerId,
          organizationId: data.organizationId,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
          details: {
            entityType: data.entityType,
            entityId: data.entityId,
            referer: metadata.referer,
            ...data.details,
          },
          success: true,
        },
      })
    } catch (error) {
      console.error('[SecurityAuditLogger] Error logging sensitive action:', error)
    }
  }

  /**
   * Registra un logout
   */
  static async logLogout(
    userId: string,
    customerId?: string,
    organizationId?: string,
    request?: NextRequest
  ): Promise<void> {
    try {
      const metadata = this.getRequestMetadata(request)

      await prisma.securityLog.create({
        data: {
          type: 'LOGOUT',
          userId,
          customerId,
          organizationId,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
          success: true,
        },
      })
    } catch (error) {
      console.error('[SecurityAuditLogger] Error logging logout:', error)
    }
  }

  /**
   * Registra intentos de acceso no autorizados
   */
  static async logUnauthorizedAttempt(
    userId: string | null,
    customerId: string | null,
    resource: string,
    action: string,
    request?: NextRequest
  ): Promise<void> {
    try {
      const metadata = this.getRequestMetadata(request)

      await prisma.securityLog.create({
        data: {
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          userId: userId || undefined,
          customerId: customerId || undefined,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
          details: {
            resource,
            action,
            referer: metadata.referer,
          },
          success: false,
        },
      })
    } catch (error) {
      console.error('[SecurityAuditLogger] Error logging unauthorized attempt:', error)
    }
  }

  /**
   * Obtiene logs de seguridad para un usuario
   */
  static async getUserLogs(
    userId: string,
    limit: number = 50
  ) {
    return prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Obtiene logs de seguridad para un cliente
   */
  static async getCustomerLogs(
    customerId: string,
    limit: number = 100
  ) {
    return prisma.securityLog.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Obtiene intentos de login fallidos recientes
   */
  static async getFailedLoginAttempts(
    identifier: string,
    hours: number = 24
  ) {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    return prisma.securityLog.findMany({
      where: {
        type: 'LOGIN_FAILED',
        details: {
          path: ['identifier'],
          equals: identifier,
        },
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Limpia logs antiguos (ejecutar periódicamente)
   */
  static async cleanOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.securityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return result.count
  }
}

