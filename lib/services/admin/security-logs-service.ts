import { prisma } from '@/lib/prisma'
import { SecurityLog } from '@prisma/client'
import { SecurityLogType } from '@/lib/utils/security-audit'

export interface SecurityLogFilters {
  type?: SecurityLogType | SecurityLogType[]
  userId?: string
  organizationId?: string
  customerId?: string
  ipAddress?: string
  success?: boolean
  startDate?: Date
  endDate?: Date
  search?: string // Búsqueda full-text en details y errorMessage
}

export interface SecurityLogWithUser extends SecurityLog {
  user?: {
    id: string
    email: string
    fullName?: string | null
  } | null
  organization?: {
    id: string
    name: string
    slug: string
  } | null
  customer?: {
    id: string
    razonSocial?: string | null
    nombre?: string | null
    apellido?: string | null
  } | null
}

export interface SecurityLogStats {
  total: number
  byType: { type: string; count: number }[]
  bySuccess: { success: boolean; count: number }[]
  byDate: { date: string; count: number }[]
  criticalEvents: number
  failedLogins: number
}

export class SecurityLogsService {
  /**
   * Obtener logs de seguridad con filtros y paginación
   */
  static async getSecurityLogs(
    filters: SecurityLogFilters = {},
    skip: number = 0,
    take: number = 50
  ): Promise<{ logs: SecurityLogWithUser[]; total: number }> {
    const where: any = {}

    // Filtro por tipo
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type }
      } else {
        where.type = filters.type
      }
    }

    // Filtro por usuario
    if (filters.userId) {
      where.userId = filters.userId
    }

    // Filtro por organización
    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    // Filtro por cliente
    if (filters.customerId) {
      where.customerId = filters.customerId
    }

    // Filtro por IP
    if (filters.ipAddress) {
      where.ipAddress = { contains: filters.ipAddress, mode: 'insensitive' }
    }

    // Filtro por éxito/fallo
    if (filters.success !== undefined) {
      where.success = filters.success
    }

    // Filtro por rango de fechas
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // Búsqueda full-text en details y errorMessage
    if (filters.search) {
      where.OR = [
        { errorMessage: { contains: filters.search, mode: 'insensitive' } },
        // Búsqueda en JSON (details) es más compleja, se hace después en memoria si es necesario
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          userId: true,
          customerId: true,
          organizationId: true,
          ipAddress: true,
          userAgent: true,
          details: true,
          success: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.securityLog.count({ where }),
    ])

    // Obtener información de usuarios, organizaciones y clientes
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean) as string[])]
    const orgIds = [...new Set(logs.map(log => log.organizationId).filter(Boolean) as string[])]
    const customerIds = [...new Set(logs.map(log => log.customerId).filter(Boolean) as string[])]

    const [users, organizations, customers] = await Promise.all([
      userIds.length > 0
        ? prisma.profile.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          })
        : [],
      orgIds.length > 0
        ? prisma.organization.findMany({
            where: { id: { in: orgIds } },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          })
        : [],
      customerIds.length > 0
        ? prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: {
              id: true,
              razonSocial: true,
              nombre: true,
              apellido: true,
            },
          })
        : [],
    ])

    // Crear mapas para acceso rápido
    const userMap = new Map(users.map(u => [u.id, u]))
    const orgMap = new Map(organizations.map(o => [o.id, o]))
    const customerMap = new Map(customers.map(c => [c.id, c]))

    // Filtrar por búsqueda en details si aplica
    let filteredLogs = logs
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredLogs = logs.filter(log => {
        // Buscar en errorMessage ya está en el where
        if (log.errorMessage?.toLowerCase().includes(searchLower)) {
          return true
        }
        // Buscar en details (JSON)
        if (log.details && typeof log.details === 'object') {
          const detailsStr = JSON.stringify(log.details).toLowerCase()
          if (detailsStr.includes(searchLower)) {
            return true
          }
        }
        return false
      })
    }

    // Combinar datos
    const logsWithDetails: SecurityLogWithUser[] = filteredLogs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || null : null,
      organization: log.organizationId ? orgMap.get(log.organizationId) || null : null,
      customer: log.customerId ? customerMap.get(log.customerId) || null : null,
    }))

    return {
      logs: logsWithDetails,
      total: filters.search ? filteredLogs.length : total,
    }
  }

  /**
   * Obtener log por ID
   */
  static async getSecurityLogById(id: string): Promise<SecurityLogWithUser | null> {
    const log = await prisma.securityLog.findUnique({
      where: { id },
    })

    if (!log) {
      return null
    }

    // Obtener información relacionada
    const [user, organization, customer] = await Promise.all([
      log.userId
        ? prisma.profile.findUnique({
            where: { id: log.userId },
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          })
        : null,
      log.organizationId
        ? prisma.organization.findUnique({
            where: { id: log.organizationId },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          })
        : null,
      log.customerId
        ? prisma.customer.findUnique({
            where: { id: log.customerId },
            select: {
              id: true,
              razonSocial: true,
              nombre: true,
              apellido: true,
            },
          })
        : null,
    ])

    return {
      ...log,
      user,
      organization,
      customer,
    }
  }

  /**
   * Obtener estadísticas de logs
   */
  static async getSecurityLogStats(
    filters: SecurityLogFilters = {},
    days: number = 30
  ): Promise<SecurityLogStats> {
    const startDate = filters.startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const endDate = filters.endDate || new Date()

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Aplicar filtros adicionales (excepto fechas que ya están)
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type }
      } else {
        where.type = filters.type
      }
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    // Obtener todos los logs en el período
    const logs = await prisma.securityLog.findMany({
      where,
      select: {
        type: true,
        success: true,
        createdAt: true,
      },
    })

    // Estadísticas por tipo
    const byTypeMap = new Map<string, number>()
    logs.forEach(log => {
      byTypeMap.set(log.type, (byTypeMap.get(log.type) || 0) + 1)
    })
    const byType = Array.from(byTypeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }))

    // Estadísticas por éxito/fallo
    const bySuccess = [
      { success: true, count: logs.filter(l => l.success).length },
      { success: false, count: logs.filter(l => !l.success).length },
    ]

    // Estadísticas por fecha (agrupar por día)
    const byDateMap = new Map<string, number>()
    logs.forEach(log => {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      byDateMap.set(dateKey, (byDateMap.get(dateKey) || 0) + 1)
    })
    const byDate = Array.from(byDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Eventos críticos (tipos sensibles que fallaron)
    const criticalTypes = [
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'LOGIN_FAILED',
      'RATE_LIMIT_EXCEEDED',
      'SENSITIVE_DATA_ACCESSED',
    ]
    const criticalEvents = logs.filter(
      log => !log.success && criticalTypes.includes(log.type)
    ).length

    // Intentos de login fallidos
    const failedLogins = logs.filter(
      log => log.type === 'LOGIN_FAILED' || (log.type === 'LOGIN_ATTEMPT' && !log.success)
    ).length

    return {
      total: logs.length,
      byType,
      bySuccess,
      byDate,
      criticalEvents,
      failedLogins,
    }
  }

  /**
   * Exportar logs a formato CSV
   */
  static async exportLogsToCSV(filters: SecurityLogFilters = {}): Promise<string> {
    const { logs } = await this.getSecurityLogs(filters, 0, 10000) // Máximo 10k registros

    const headers = [
      'ID',
      'Fecha',
      'Tipo',
      'Usuario',
      'Organización',
      'Cliente',
      'IP',
      'Éxito',
      'Mensaje de Error',
      'User Agent',
    ]

    const rows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.type,
      log.user?.email || log.userId || '',
      log.organization?.name || log.organizationId || '',
      log.customer?.razonSocial ||
        `${log.customer?.nombre || ''} ${log.customer?.apellido || ''}`.trim() ||
        log.customerId ||
        '',
      log.ipAddress || '',
      log.success ? 'Sí' : 'No',
      log.errorMessage || '',
      log.userAgent || '',
    ])

    // Generar CSV
    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ]

    return csvLines.join('\n')
  }

  /**
   * Exportar logs a formato JSON
   */
  static async exportLogsToJSON(filters: SecurityLogFilters = {}): Promise<any[]> {
    const { logs } = await this.getSecurityLogs(filters, 0, 10000) // Máximo 10k registros

    return logs.map(log => ({
      id: log.id,
      type: log.type,
      userId: log.userId,
      user: log.user
        ? {
            email: log.user.email,
            fullName: log.user.fullName,
          }
        : null,
      organizationId: log.organizationId,
      organization: log.organization
        ? {
            name: log.organization.name,
            slug: log.organization.slug,
          }
        : null,
      customerId: log.customerId,
      customer: log.customer
        ? {
            razonSocial: log.customer.razonSocial,
            nombre: log.customer.nombre,
            apellido: log.customer.apellido,
          }
        : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      errorMessage: log.errorMessage,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
    }))
  }
}
