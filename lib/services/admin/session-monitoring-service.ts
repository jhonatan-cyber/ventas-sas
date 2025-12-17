/**
 * Servicio de Monitoreo de Sesiones para Administradores
 * 
 * Permite supervisar y gestionar todas las sesiones activas
 * del sistema SAS desde el panel de administración
 */

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export interface SessionStats {
  totalActiveSessions: number
  totalUsers: number
  totalOrganizations: number
  sessionsLast24h: number
  refreshesLast24h: number
  suspiciousActivity: number
  topOrganizations: Array<{
    id: string
    name: string
    slug: string
    activeSessions: number
    activeUsers: number
  }>
}

export interface SessionDetails {
  id: string
  userId: string
  userName: string
  userEmail: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  deviceName?: string
  deviceInfo?: any
  ipAddress?: string
  userAgent?: string
  isActive: boolean
  isCurrent: boolean
  createdAt: Date
  lastActivityAt: Date
  lastRefreshAt?: Date
  refreshCount: number
  rememberMe: boolean
  expiresAt: Date
  location?: string // Geolocalización aproximada por IP
  riskScore: number // Puntuación de riesgo calculada
}

export interface SecurityAlert {
  id: string
  type: 'SUSPICIOUS_LOGIN' | 'MULTIPLE_DEVICES' | 'UNUSUAL_LOCATION' | 'TOKEN_THEFT' | 'BRUTE_FORCE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  userName?: string
  organizationId?: string
  organizationName?: string
  description: string
  details: any
  createdAt: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export class SessionMonitoringService {
  /**
   * Obtiene estadísticas generales del sistema
   */
  static async getSystemStats(): Promise<SessionStats> {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalActiveSessions,
      totalUsers,
      totalOrganizations,
      sessionsLast24h,
      refreshesLast24h,
      suspiciousActivity,
      topOrganizations
    ] = await Promise.all([
      // Sesiones activas totales
      prisma.enhancedSession.count({
        where: { isActive: true }
      }),

      // Usuarios únicos con sesiones activas
      prisma.enhancedSession.groupBy({
        by: ['userId'],
        where: { isActive: true },
        _count: true
      }).then(result => result.length),

      // Organizaciones con sesiones activas
      prisma.enhancedSession.groupBy({
        by: ['organizationId'],
        where: { isActive: true },
        _count: true
      }).then(result => result.length),

      // Sesiones creadas en las últimas 24h
      prisma.enhancedSession.count({
        where: {
          createdAt: { gte: yesterday }
        }
      }),

      // Refreshes en las últimas 24h
      prisma.enhancedSession.aggregate({
        where: {
          lastRefreshAt: { gte: yesterday }
        },
        _sum: { refreshCount: true }
      }).then(result => result._sum.refreshCount || 0),

      // Actividad sospechosa (múltiples IPs, muchos refreshes, etc.)
      prisma.enhancedSession.count({
        where: {
          OR: [
            { refreshCount: { gt: 50 } }, // Muchos refreshes
            { 
              AND: [
                { createdAt: { gte: yesterday } },
                { lastActivityAt: { lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) } } // Inactivo por 2h pero reciente
              ]
            }
          ]
        }
      }),

      // Top organizaciones por actividad
      prisma.enhancedSession.groupBy({
        by: ['organizationId'],
        where: { isActive: true },
        _count: {
          id: true,
          userId: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }).then(async (groups) => {
        const orgIds = groups.map(g => g.organizationId)
        const organizations = await prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true, slug: true }
        })

        return groups.map(group => {
          const org = organizations.find(o => o.id === group.organizationId)
          return {
            id: group.organizationId,
            name: org?.name || 'Organización Desconocida',
            slug: org?.slug || 'unknown',
            activeSessions: group._count.id,
            activeUsers: group._count.userId
          }
        })
      })
    ])

    return {
      totalActiveSessions,
      totalUsers,
      totalOrganizations,
      sessionsLast24h,
      refreshesLast24h,
      suspiciousActivity,
      topOrganizations
    }
  }

  /**
   * Obtiene todas las sesiones activas con detalles
   */
  static async getAllActiveSessions(
    page: number = 1,
    pageSize: number = 50,
    filters: {
      organizationId?: string
      userId?: string
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
      deviceType?: string
      ipAddress?: string
    } = {}
  ): Promise<{
    sessions: SessionDetails[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const offset = (page - 1) * pageSize

    // Construir filtros
    const where: any = {
      isActive: true
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.ipAddress) {
      where.ipAddress = { contains: filters.ipAddress }
    }

    const [sessions, total] = await Promise.all([
      prisma.enhancedSession.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              ci: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { lastActivityAt: 'desc' },
        skip: offset,
        take: pageSize
      }),
      prisma.enhancedSession.count({ where })
    ])

    const sessionsWithDetails: SessionDetails[] = await Promise.all(
      sessions.map(async (session) => {
        const riskScore = await this.calculateRiskScore(session)
        const location = await this.getLocationFromIP(session.ipAddress || undefined)

        return {
          id: session.id,
          userId: session.userId,
          userName: `${session.user.nombre} ${session.user.apellido}`.trim(),
          userEmail: session.user.email || session.user.ci || 'Sin email',
          organizationId: session.organizationId,
          organizationName: session.organization.name || 'Sin nombre',
          organizationSlug: session.organization.slug,
          deviceName: session.deviceName || undefined,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress || undefined,
          userAgent: session.userAgent || undefined,
          isActive: session.isActive,
          isCurrent: session.isCurrent,
          createdAt: session.createdAt,
          lastActivityAt: session.lastActivityAt,
          lastRefreshAt: session.lastRefreshAt || undefined,
          refreshCount: session.refreshCount,
          rememberMe: session.rememberMe,
          expiresAt: session.expiresAt,
          location,
          riskScore
        }
      })
    )

    // Filtrar por nivel de riesgo si se especifica
    let filteredSessions = sessionsWithDetails
    if (filters.riskLevel) {
      const riskThresholds = { LOW: 30, MEDIUM: 70, HIGH: 100 }
      const minRisk = filters.riskLevel === 'LOW' ? 0 : 
                     filters.riskLevel === 'MEDIUM' ? 30 : 70
      const maxRisk = riskThresholds[filters.riskLevel]
      
      filteredSessions = sessionsWithDetails.filter(
        s => s.riskScore >= minRisk && s.riskScore < maxRisk
      )
    }

    return {
      sessions: filteredSessions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * Obtiene alertas de seguridad
   */
  static async getSecurityAlerts(
    page: number = 1,
    pageSize: number = 20,
    _filters: {
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      type?: string
      resolved?: boolean
      organizationId?: string
    } = {}
  ): Promise<{
    alerts: SecurityAlert[]
    total: number
    page: number
    pageSize: number
  }> {
    // Por ahora, generar alertas basadas en patrones sospechosos
    // En el futuro, esto vendría de una tabla dedicada
    const suspiciousSessions = await prisma.enhancedSession.findMany({
      where: {
        OR: [
          { refreshCount: { gt: 100 } }, // Muchos refreshes
          { 
            AND: [
              { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
              { refreshCount: { gt: 20 } }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        organization: {
          select: {
            name: true
          }
        }
      },
      take: pageSize,
      skip: (page - 1) * pageSize
    })

    const alerts: SecurityAlert[] = suspiciousSessions.map(session => ({
      id: `alert-${session.id}`,
      type: session.refreshCount > 100 ? 'TOKEN_THEFT' : 'SUSPICIOUS_LOGIN',
      severity: session.refreshCount > 100 ? 'HIGH' : 'MEDIUM',
      userId: session.userId,
      userName: `${session.user.nombre} ${session.user.apellido}`.trim(),
      organizationId: session.organizationId,
      organizationName: session.organization.name || 'Sin nombre',
      description: session.refreshCount > 100 
        ? `Usuario con ${session.refreshCount} refreshes de token - posible robo`
        : `Actividad sospechosa detectada`,
      details: {
        sessionId: session.id,
        refreshCount: session.refreshCount,
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivityAt
      },
      createdAt: session.lastActivityAt,
      resolved: false
    }))

    return {
      alerts,
      total: alerts.length,
      page,
      pageSize
    }
  }

  /**
   * Invalida una sesión específica
   */
  static async invalidateSession(
    sessionId: string,
    adminUserId: string,
    reason: string
  ): Promise<boolean> {
    try {
      await prisma.enhancedSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: `ADMIN_ACTION: ${reason}`
        }
      })

      logger.security('Sesión invalidada por administrador', {
        sessionId,
        adminUserId,
        reason
      })

      return true
    } catch (error) {
      logger.error('Error invalidando sesión', error as Error, {
        sessionId,
        adminUserId
      })
      return false
    }
  }

  /**
   * Invalida todas las sesiones de un usuario
   */
  static async invalidateUserSessions(
    userId: string,
    organizationId: string,
    adminUserId: string,
    reason: string
  ): Promise<number> {
    try {
      const result = await prisma.enhancedSession.updateMany({
        where: {
          userId,
          organizationId,
          isActive: true
        },
        data: {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: `ADMIN_ACTION: ${reason}`
        }
      })

      logger.security('Sesiones de usuario invalidadas por administrador', {
        userId,
        organizationId,
        adminUserId,
        reason,
        sessionsInvalidated: result.count
      })

      return result.count
    } catch (error) {
      logger.error('Error invalidando sesiones de usuario', error as Error, {
        userId,
        organizationId,
        adminUserId
      })
      return 0
    }
  }

  /**
   * Obtiene métricas de uso por organización
   */
  static async getOrganizationMetrics(organizationId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalSessions,
      activeSessions,
      uniqueUsers,
      avgSessionDuration,
      topDevices,
      loginTrends
    ] = await Promise.all([
      // Total de sesiones en el período
      prisma.enhancedSession.count({
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      }),

      // Sesiones actualmente activas
      prisma.enhancedSession.count({
        where: {
          organizationId,
          isActive: true
        }
      }),

      // Usuarios únicos
      prisma.enhancedSession.groupBy({
        by: ['userId'],
        where: {
          organizationId,
          createdAt: { gte: startDate }
        }
      }).then(result => result.length),

      // Duración promedio de sesión (aproximada)
      prisma.enhancedSession.findMany({
        where: {
          organizationId,
          createdAt: { gte: startDate },
          invalidatedAt: { not: null }
        },
        select: {
          createdAt: true,
          invalidatedAt: true
        }
      }).then(sessions => {
        if (sessions.length === 0) return 0
        const totalDuration = sessions.reduce((sum, session) => {
          if (session.invalidatedAt) {
            return sum + (session.invalidatedAt.getTime() - session.createdAt.getTime())
          }
          return sum
        }, 0)
        return Math.round(totalDuration / sessions.length / (1000 * 60)) // minutos
      }),

      // Top dispositivos
      prisma.enhancedSession.groupBy({
        by: ['deviceInfo'],
        where: {
          organizationId,
          createdAt: { gte: startDate },
          deviceInfo: { not: Prisma.JsonNull }
        },
        _count: true,
        orderBy: {
          _count: {
            deviceInfo: 'desc'
          }
        },
        take: 5
      }),

      // Tendencia de logins por día
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as logins
        FROM enhanced_sessions 
        WHERE organization_id = ${organizationId}
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `
    ])

    return {
      totalSessions,
      activeSessions,
      uniqueUsers,
      avgSessionDuration,
      topDevices: topDevices.map(d => ({
        device: d.deviceInfo,
        count: d._count
      })),
      loginTrends
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Calcula puntuación de riesgo para una sesión
   */
  private static async calculateRiskScore(session: any): Promise<number> {
    let score = 0

    // Muchos refreshes = sospechoso
    if (session.refreshCount > 50) score += 30
    else if (session.refreshCount > 20) score += 15

    // Sesión muy antigua pero activa = sospechoso
    const ageInDays = (Date.now() - session.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays > 30) score += 20
    else if (ageInDays > 7) score += 10

    // Inactividad reciente = sospechoso
    const inactiveMinutes = (Date.now() - session.lastActivityAt.getTime()) / (1000 * 60)
    if (inactiveMinutes > 120) score += 15 // 2 horas
    else if (inactiveMinutes > 60) score += 5 // 1 hora

    // IP desconocida o múltiples IPs para el mismo usuario
    const userSessions = await prisma.enhancedSession.findMany({
      where: {
        userId: session.userId,
        isActive: true,
        id: { not: session.id }
      },
      select: { ipAddress: true }
    })

    const uniqueIPs = new Set(userSessions.map(s => s.ipAddress).filter(Boolean))
    if (uniqueIPs.size > 3) score += 25 // Muchas IPs diferentes
    else if (uniqueIPs.size > 1) score += 10

    return Math.min(score, 100) // Máximo 100
  }

  /**
   * Obtiene ubicación aproximada desde IP (mock)
   */
  private static async getLocationFromIP(ip?: string): Promise<string | undefined> {
    if (!ip || ip === 'unknown') return undefined
    
    // En producción, usar servicio como ipapi.co o MaxMind
    // Por ahora, retornar ubicación mock
    const mockLocations = [
      'La Paz, Bolivia',
      'Santa Cruz, Bolivia',
      'Cochabamba, Bolivia',
      'Sucre, Bolivia',
      'Oruro, Bolivia'
    ]
    
    return mockLocations[Math.floor(Math.random() * mockLocations.length)]
  }
}