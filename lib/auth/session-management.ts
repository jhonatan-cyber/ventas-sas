/**
 * Gestión de Sesiones de Usuario
 * 
 * Sistema para tracking y gestión de sesiones activas con:
 * - Timeout de inactividad
 * - Invalidación al cambiar contraseña
 * - Sesión única por usuario (opcional)
 * - Tracking de dispositivo/IP
 */

import { randomBytes } from 'crypto'

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'

export type SystemType = 'admin' | 'sas'

interface SessionData {
  userId: string
  organizationId?: string // Para sistema SAS
  systemType: SystemType
  ipAddress?: string
  userAgent?: string
  deviceInfo?: {
    device?: string
    browser?: string
    os?: string
  }
  expiresInHours?: number // Default: 24 horas para SAS, 168 horas (7 días) para Admin
}

interface SessionConfig {
  inactivityTimeoutMinutes?: number // Default: 30 minutos
  forceSingleSession?: boolean // Si true, invalida otras sesiones al crear nueva
  trackDevice?: boolean // Si true, guarda info del dispositivo
}

export class SessionManagement {
  private static readonly DEFAULT_EXPIRY_HOURS = {
    admin: 168, // 7 días
    sas: 24,   // 1 día
  }

  private static readonly DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 30

  /**
   * Crea una nueva sesión
   */
  static async createSession(data: SessionData, config: SessionConfig = {}): Promise<string> {
    const {
      userId,
      organizationId,
      systemType,
      ipAddress,
      userAgent,
      deviceInfo,
      expiresInHours,
    } = data

    const {
      forceSingleSession = false,
      trackDevice = true,
    } = config

    // Invalidar otras sesiones si se requiere sesión única
    if (forceSingleSession) {
      await this.invalidateUserSessions(userId, systemType, organizationId)
    }

    // Generar token único para la sesión
    const sessionToken = this.generateSessionToken()

    // Calcular expiración
    const expiryHours = expiresInHours || this.DEFAULT_EXPIRY_HOURS[systemType]
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    // Crear sesión según el sistema
    if (systemType === 'admin') {
      await prisma.userSession.create({
        data: {
          userId,
          sessionToken,
          systemType: 'admin',
          ipAddress,
          userAgent,
          deviceInfo: trackDevice ? deviceInfo : undefined,
          expiresAt,
          lastActivityAt: new Date(),
        },
      })
    } else if (systemType === 'sas') {
      if (!organizationId) {
        throw new Error('organizationId es requerido para sesiones SAS')
      }

      await prisma.sasSession.create({
        data: {
          userId,
          organizationId,
          sessionToken,
          ipAddress,
          userAgent,
          deviceInfo: trackDevice ? deviceInfo : undefined,
          expiresAt,
          lastActivityAt: new Date(),
        },
      })
    }

    return sessionToken
  }

  /**
   * Verifica si una sesión es válida
   */
  static async validateSession(
    sessionToken: string,
    systemType: SystemType,
    organizationId?: string
  ): Promise<{ valid: boolean; userId?: string; needsRefresh?: boolean }> {
    try {
      if (systemType === 'admin') {
        const session = await prisma.userSession.findUnique({
          where: { sessionToken },
          select: {
            id: true,
            userId: true,
            isActive: true,
            expiresAt: true,
            lastActivityAt: true,
            user: {
              select: {
                isActive: true,
                passwordChangedAt: true,
              },
            },
          },
        })

        if (!session || !session.isActive) {
          return { valid: false }
        }

        // Verificar expiración
        if (session.expiresAt < new Date()) {
          await this.invalidateSession(sessionToken, systemType)
          return { valid: false }
        }

        // Verificar inactividad
        const inactivityTimeout = this.DEFAULT_INACTIVITY_TIMEOUT_MINUTES
        const lastActivity = session.lastActivityAt
        const minutesSinceActivity = (Date.now() - lastActivity.getTime()) / (60 * 1000)

        if (minutesSinceActivity > inactivityTimeout) {
          await this.invalidateSession(sessionToken, systemType)
          return { valid: false }
        }

        // Verificar que el usuario sigue activo
        if (!session.user.isActive) {
          await this.invalidateSession(sessionToken, systemType)
          return { valid: false }
        }

        // Verificar si la contraseña cambió después de crear la sesión
        // (esto requeriría agregar passwordChangedAt al modelo Profile)
        // Por ahora, asumimos que si el usuario está activo, la sesión es válida

        return {
          valid: true,
          userId: session.userId,
          needsRefresh: minutesSinceActivity > inactivityTimeout * 0.8, // Refresh si >80% del tiempo
        }
      } else if (systemType === 'sas') {
        if (!organizationId) {
          return { valid: false }
        }

        const session = await prisma.sasSession.findUnique({
          where: { sessionToken },
          select: {
            id: true,
            userId: true,
            organizationId: true,
            isActive: true,
            expiresAt: true,
            lastActivityAt: true,
            createdAt: true,
            user: {
              select: {
                isActive: true,
                passwordChangedAt: true,
              },
            },
          },
        })

        if (!session || !session.isActive || session.organizationId !== organizationId) {
          return { valid: false }
        }

        // Verificar expiración
        if (session.expiresAt < new Date()) {
          await this.invalidateSession(sessionToken, systemType, organizationId)
          return { valid: false }
        }

        // Verificar inactividad
        const inactivityTimeout = this.DEFAULT_INACTIVITY_TIMEOUT_MINUTES
        const lastActivity = session.lastActivityAt
        const minutesSinceActivity = (Date.now() - lastActivity.getTime()) / (60 * 1000)

        if (minutesSinceActivity > inactivityTimeout) {
          await this.invalidateSession(sessionToken, systemType, organizationId)
          return { valid: false }
        }

        // Verificar que el usuario sigue activo
        if (!session.user || !session.user.isActive) {
          await this.invalidateSession(sessionToken, systemType, organizationId)
          return { valid: false }
        }

        // Verificar si la contraseña cambió después de crear la sesión
        if (session.user.passwordChangedAt && session.createdAt < session.user.passwordChangedAt) {
          await this.invalidateSession(sessionToken, systemType, organizationId)
          return { valid: false }
        }

        return {
          valid: true,
          userId: session.userId || undefined,
          needsRefresh: minutesSinceActivity > inactivityTimeout * 0.8,
        }
      }

      return { valid: false }
    } catch (error) {
      console.error('Error validando sesión:', error)
      return { valid: false }
    }
  }

  /**
   * Actualiza la última actividad de una sesión
   */
  static async updateActivity(sessionToken: string, systemType: SystemType): Promise<void> {
    const updateData = {
      lastActivityAt: new Date(),
    }

    if (systemType === 'admin') {
      await prisma.userSession.updateMany({
        where: { sessionToken, isActive: true },
        data: updateData,
      })
    } else if (systemType === 'sas') {
      await prisma.sasSession.updateMany({
        where: { sessionToken, isActive: true },
        data: updateData,
      })
    }
  }

  /**
   * Invalida una sesión específica
   */
  static async invalidateSession(
    sessionToken: string,
    systemType: SystemType,
    organizationId?: string
  ): Promise<void> {
    if (systemType === 'admin') {
      await prisma.userSession.updateMany({
        where: { sessionToken },
        data: { isActive: false },
      })
    } else if (systemType === 'sas') {
      await prisma.sasSession.updateMany({
        where: {
          sessionToken,
          ...(organizationId && { organizationId }),
        },
        data: { isActive: false },
      })
    }
  }

  /**
   * Invalida todas las sesiones de un usuario
   */
  static async invalidateUserSessions(
    userId: string,
    systemType: SystemType,
    organizationId?: string
  ): Promise<number> {
    if (systemType === 'admin') {
      const result = await prisma.userSession.updateMany({
        where: {
          userId,
          systemType: 'admin',
          isActive: true,
        },
        data: { isActive: false },
      })
      return result.count
    } else if (systemType === 'sas') {
      if (!organizationId) {
        return 0
      }

      const result = await prisma.sasSession.updateMany({
        where: {
          userId,
          organizationId,
          isActive: true,
        },
        data: { isActive: false },
      })
      return result.count
    }

    return 0
  }

  /**
   * Invalida todas las sesiones de un usuario al cambiar contraseña
   */
  static async invalidateSessionsOnPasswordChange(
    userId: string,
    systemType: SystemType,
    organizationId?: string
  ): Promise<number> {
    // Registrar cambio de contraseña
    await prisma.passwordChange.create({
      data: {
        userId,
        systemType,
        invalidatedSessions: 0, // Se actualizará después
      },
    })

    const invalidated = await this.invalidateUserSessions(userId, systemType, organizationId)

    // Actualizar conteo de sesiones invalidadas
    await prisma.passwordChange.updateMany({
      where: {
        userId,
        systemType,
        changedAt: {
          gte: new Date(Date.now() - 60000), // Último minuto
        },
      },
      data: {
        invalidatedSessions: invalidated,
      },
    })

    return invalidated
  }

  /**
   * Limpia sesiones expiradas (debería ejecutarse periódicamente)
   */
  static async cleanupExpiredSessions(): Promise<{ admin: number; sas: number }> {
    const now = new Date()

    const adminResult = await prisma.userSession.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          {
            lastActivityAt: {
              lt: new Date(now.getTime() - this.DEFAULT_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000),
            },
          },
        ],
        isActive: true,
      },
      data: { isActive: false },
    })

    const sasResult = await prisma.sasSession.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          {
            lastActivityAt: {
              lt: new Date(now.getTime() - this.DEFAULT_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000),
            },
          },
        ],
        isActive: true,
      },
      data: { isActive: false },
    })

    return {
      admin: adminResult.count,
      sas: sasResult.count,
    }
  }

  /**
   * Obtiene información del dispositivo desde el request
   */
  static getDeviceInfo(request: NextRequest): {
    device?: string
    browser?: string
    os?: string
  } {
    const userAgent = request.headers.get("User-agent") || ''

    // Parsing básico de user agent (en producción, usar una librería como 'ua-parser-js')
    const browser = this.parseBrowser(userAgent)
    const os = this.parseOS(userAgent)

    return {
      browser,
      os,
    }
  }

  /**
   * Genera un token único para la sesión
   */
  private static generateSessionToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Parsea el navegador desde user agent (básico)
   */
  private static parseBrowser(userAgent: string): string | undefined {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return undefined
  }

  /**
   * Parsea el OS desde user agent (básico)
   */
  private static parseOS(userAgent: string): string | undefined {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return undefined
  }
}

