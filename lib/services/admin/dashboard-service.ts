import { prisma } from '@/lib/prisma'

export interface DashboardAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
}

export interface HealthMetrics {
  uptime: number // Porcentaje
  averageLatency: number // En ms
  errorRate: number // Porcentaje
  lastCheck: string
}

export class DashboardService {
  /**
   * Obtener alertas destacadas del sistema
   */
  static async getAlerts(): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = []

    try {
      // Verificar suscripciones próximas a vencer (próximos 7 días)
      const upcomingExpirations = await prisma.subscription.findMany({
        where: {
          status: 'active',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Próximos 7 días
          },
        },
        include: {
          organization: true,
        },
        take: 5,
      })

      for (const subscription of upcomingExpirations) {
        if (!subscription.endDate || !subscription.organization) continue
        const daysUntilExpiry = Math.ceil(
          (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        alerts.push({
          id: `subscription-expiry-${subscription.id}`,
          type: daysUntilExpiry <= 3 ? 'error' : 'warning',
          title: 'Suscripción próxima a vencer',
          message: `La suscripción de ${subscription.organization.name} vence en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}`,
          actionUrl: `/administracion/organizations/${subscription.organizationId}`,
          actionLabel: 'Ver organización',
        })
      }

      // Verificar suscripciones expiradas
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          status: 'active',
          endDate: {
            lt: new Date(),
          },
        },
        include: {
          organization: true,
        },
        take: 5,
      })

      for (const subscription of expiredSubscriptions) {
        if (!subscription.organization) continue
        alerts.push({
          id: `subscription-expired-${subscription.id}`,
          type: 'error',
          title: 'Suscripción expirada',
          message: `La suscripción de ${subscription.organization.name} ha expirado`,
          actionUrl: `/administracion/organizations/${subscription.organizationId}`,
          actionLabel: 'Renovar suscripción',
        })
      }

      // Verificar tickets de soporte urgentes sin asignar
      if (prisma && (prisma as any).supportTicket) {
        const urgentTickets = await (prisma as any).supportTicket.findMany({
          where: {
            status: { in: ['open', 'in_progress'] },
            priority: 'urgent',
            assignedToId: null,
          },
          include: {
            organization: true,
          },
          take: 3,
        })

        for (const ticket of urgentTickets) {
          alerts.push({
            id: `urgent-ticket-${ticket.id}`,
            type: 'error',
            title: 'Ticket urgente sin asignar',
            message: `Ticket ${ticket.ticketNumber} de ${ticket.organization.name} requiere atención urgente`,
            actionUrl: `/administracion/support?ticket=${ticket.id}`,
            actionLabel: 'Ver ticket',
          })
        }
      }

      // Verificar facturas vencidas
      if (prisma && (prisma as any).invoice) {
        const overdueInvoices = await (prisma as any).invoice.findMany({
          where: {
            status: { in: ['pending', 'overdue'] },
            dueDate: {
              lt: new Date(),
            },
          },
          include: {
            organization: true,
          },
          take: 5,
        })

        for (const invoice of overdueInvoices) {
          alerts.push({
            id: `overdue-invoice-${invoice.id}`,
            type: 'warning',
            title: 'Factura vencida',
            message: `Factura #${invoice.invoiceNumber} de ${invoice.organization.name} está vencida`,
            actionUrl: `/administracion/billing?invoice=${invoice.id}`,
            actionLabel: 'Ver factura',
          })
        }
      }

      // Verificar problemas críticos en logs de seguridad
      const criticalSecurityLogs = await prisma.securityLog.findMany({
        where: {
          type: {
            in: ['LOGIN_FAILED_MULTIPLE', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY'],
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      })

      if (criticalSecurityLogs.length > 0) {
        alerts.push({
          id: 'security-alerts',
          type: 'error',
          title: 'Actividad de seguridad detectada',
          message: `Se han detectado ${criticalSecurityLogs.length} evento${criticalSecurityLogs.length !== 1 ? 's' : ''} crítico${criticalSecurityLogs.length !== 1 ? 's' : ''} en las últimas 24 horas`,
          actionUrl: '/administracion/logs?type=security',
          actionLabel: 'Ver logs',
        })
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }

    return alerts
  }

  /**
   * Obtener métricas de salud del sistema
   */
  static async getHealthMetrics(): Promise<HealthMetrics> {
    try {
      // Calcular uptime basado en logs del sistema (últimos 30 días)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      // Obtener logs de errores del sistema en los últimos 30 días
      const errorLogs = await prisma.securityLog.findMany({
        where: {
          type: 'SYSTEM_ERROR',
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      })

      // Obtener total de requests (aproximado por logs)
      const totalLogs = await prisma.securityLog.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      })

      // Calcular uptime (asumiendo que si hay menos del 0.1% de errores, el sistema está arriba)
      const errorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0
      const uptime = Math.max(0, 100 - errorRate)

      // Calcular latencia promedio (simulado - en producción deberías usar métricas reales)
      // Por ahora, asumimos una latencia base basada en consultas recientes
      let averageLatency = 150 // ms base

      // Si hay muchos logs de errores, asumimos mayor latencia
      if (errorRate > 1) {
        averageLatency = 300 + errorRate * 50
      }

      // Tasa de errores (porcentaje de logs que son errores)
      const systemErrorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0

      return {
        uptime: Math.min(100, Math.max(0, uptime)),
        averageLatency: Math.round(averageLatency),
        errorRate: Math.min(100, Math.max(0, systemErrorRate)),
        lastCheck: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error calculating health metrics:', error)
      
      // Retornar métricas por defecto en caso de error
      return {
        uptime: 99.9,
        averageLatency: 150,
        errorRate: 0.1,
        lastCheck: new Date().toISOString(),
      }
    }
  }

  /**
   * Obtener actividad reciente con filtro de período
   */
  static async getRecentActivity(period: '7d' | '30d' | '90d' | '1y' | 'all', limit: number = 20) {
    const periods: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    }

    const daysAgo = period === 'all' ? null : periods[period]
    const startDate = daysAgo ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) : null

    const where = startDate
      ? {
          createdAt: {
            gte: startDate,
          },
        }
      : {}

    // Obtener actividad de diferentes fuentes
    const [
      recentOrganizations,
      recentUsers,
      recentSubscriptions,
      recentLogs,
    ] = await Promise.all([
      prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      }),
      prisma.profile.findMany({
        where: {
          ...where,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.subscription.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          organization: {
            select: {
              name: true,
            },
          },
          plan: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.securityLog.findMany({
        where: {
          ...where,
          type: {
            in: ['LOGIN', 'CREATE', 'UPDATE', 'DELETE'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          createdAt: true,
          userId: true,
          success: true,
          details: true,
        },
      }),
    ])

    const activities: Array<{
      id: string
      type: string
      description: string
      createdAt: Date
      userId?: string
      organizationId?: string
    }> = []

    // Agregar organizaciones creadas
    for (const org of recentOrganizations) {
      activities.push({
        id: `org-${org.id}`,
        type: 'organization',
        description: `Nueva organización creada: ${org.name}`,
        createdAt: org.createdAt,
      })
    }

    // Agregar usuarios creados
    for (const user of recentUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        description: `Nuevo usuario: ${user.fullName || user.email}`,
        createdAt: user.createdAt,
        userId: user.id,
      })
    }

    // Agregar cambios de suscripción
    for (const sub of recentSubscriptions) {
      if (!sub.organization) continue
      const planName = sub.plan?.name || 'Plan desconocido'
      activities.push({
        id: `sub-${sub.id}`,
        type: 'subscription',
        description: `Suscripción actualizada: ${sub.organization.name} - ${planName}`,
        createdAt: sub.updatedAt,
        organizationId: sub.organizationId || undefined,
      })
    }

    // Agregar logs de seguridad
    for (const log of recentLogs) {
      // Construir descripción desde el tipo y detalles disponibles
      let description = log.type
      if (log.details && typeof log.details === 'object') {
        const details = log.details as Record<string, any>
        if (details.description) {
          description = details.description
        } else if (details.action) {
          description = `${log.type}: ${details.action}`
        }
      }
      
      activities.push({
        id: `log-${log.id}`,
        type: log.type.toLowerCase(),
        description: description,
        createdAt: log.createdAt,
        userId: log.userId || undefined,
      })
    }

    // Ordenar por fecha y limitar
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return activities.slice(0, limit).map((activity) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
    }))
  }
}
