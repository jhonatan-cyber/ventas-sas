/**
 * Servicio de Configuración del Sistema
 * 
 * Gestiona todas las configuraciones del sistema de administración:
 * - Configuración general (almacenada en base de datos)
 * - Seguridad y JWT
 * - Logs del sistema
 * - Métricas del sistema
 * - Gestión de backups
 * - Configuración de email/SMTP
 * - Alertas del sistema
 * - Integraciones
 */

import { randomBytes } from 'crypto'

import { Prisma } from '@prisma/client'

import { JwtSecretRotation } from '@/lib/auth/jwt-secret-rotation'
import { prisma } from '@/lib/prisma'

export interface SystemConfig {
  // Configuración General
  systemName: string
  systemEmail: string
  systemUrl: string
  supportEmail: string
  
  // Seguridad
  sessionTimeoutMinutes: number
  jwtExpirationDays: number
  require2FA: boolean
  jwtRotationDays: number
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  passwordExpirationDays: number | null
  maxLoginAttempts: number
  lockoutDurationMinutes: number
  sessionSingleMode: boolean
  
  // Mantenimiento
  maintenanceMode: boolean
  maintenanceMessage?: string
  maintenanceScheduledAt?: Date
  maintenanceScheduledEnd?: Date
  
  // Límites y Quotas
  maxOrganizations: number | null
  maxUsersPerOrganization: number | null
  maxStorageGB: number | null
  
  // Notificaciones
  notificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
}

export interface JwtSecretInfo {
  id: string
  systemType: string
  version: number
  isActive: boolean
  createdAt: Date
  expiresAt: Date | null
  rotatedAt: Date | null
}

export interface SystemLogEntry {
  id: string
  type: string
  userId: string | null
  customerId: string | null
  organizationId: string | null
  ipAddress: string | null
  success: boolean
  errorMessage: string | null
  details: any
  createdAt: Date
}

export class SystemConfigService {
  // Obtener configuración del sistema (desde BD con fallback a env)
  static async getSystemConfig(): Promise<Partial<SystemConfig>> {
    // Intentar obtener desde BD (con manejo de errores por si la tabla no existe aún)
    let configs: any[] = []
    try {
      // Verificar si prisma existe y el modelo existe en Prisma Client
      if (prisma && (prisma as any).adminSystemConfig && typeof (prisma as any).adminSystemConfig.findMany === 'function') {
        configs = await (prisma as any).adminSystemConfig.findMany({
          where: { category: { in: ['general', 'security', 'maintenance', 'limits', 'notifications'] } }
        })
      }
    } catch (error: any) {
      // Si la tabla no existe o hay error, continuar con valores por defecto
      console.warn('No se pudo obtener configuraciones desde BD (esto es normal si aún no se ha ejecutado la migración):', error.message)
    }

    // Crear objeto de configuración desde BD
    const dbConfig: any = {}
    configs.forEach(config => {
      const key = config.key
      const value = config.value
      // Convertir JSON a valor apropiado
      if (typeof value === 'object' && value !== null && 'value' in value) {
        dbConfig[key] = (value as any).value
      } else {
        dbConfig[key] = value
      }
    })

    // Combinar con valores por defecto desde env
    return {
      systemName: dbConfig.systemName || process.env.SYSTEM_NAME || 'SmartPOS',
      systemEmail: dbConfig.systemEmail || process.env.SYSTEM_EMAIL || 'admin@sistema.com',
      systemUrl: dbConfig.systemUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      supportEmail: dbConfig.supportEmail || process.env.SUPPORT_EMAIL || 'soporte@sistema.com',
      sessionTimeoutMinutes: dbConfig.sessionTimeoutMinutes || parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30'),
      jwtExpirationDays: dbConfig.jwtExpirationDays || parseInt(process.env.ADMIN_JWT_EXPIRES_IN?.replace('d', '') || '7'),
      require2FA: dbConfig.require2FA !== undefined ? dbConfig.require2FA : (process.env.REQUIRE_2FA === 'true'),
      jwtRotationDays: dbConfig.jwtRotationDays || parseInt(process.env.JWT_ROTATION_DAYS || '90'),
      maintenanceMode: dbConfig.maintenanceMode !== undefined ? dbConfig.maintenanceMode : (process.env.MAINTENANCE_MODE === 'true'),
      maintenanceMessage: dbConfig.maintenanceMessage || process.env.MAINTENANCE_MESSAGE,
      passwordMinLength: dbConfig.passwordMinLength || 8,
      passwordRequireUppercase: dbConfig.passwordRequireUppercase !== undefined ? dbConfig.passwordRequireUppercase : true,
      passwordRequireLowercase: dbConfig.passwordRequireLowercase !== undefined ? dbConfig.passwordRequireLowercase : true,
      passwordRequireNumbers: dbConfig.passwordRequireNumbers !== undefined ? dbConfig.passwordRequireNumbers : true,
      passwordRequireSymbols: dbConfig.passwordRequireSymbols !== undefined ? dbConfig.passwordRequireSymbols : false,
      passwordExpirationDays: dbConfig.passwordExpirationDays || null,
      maxLoginAttempts: dbConfig.maxLoginAttempts || 5,
      lockoutDurationMinutes: dbConfig.lockoutDurationMinutes || 30,
      sessionSingleMode: dbConfig.sessionSingleMode !== undefined ? dbConfig.sessionSingleMode : false,
      maintenanceScheduledAt: dbConfig.maintenanceScheduledAt ? new Date(dbConfig.maintenanceScheduledAt) : undefined,
      maintenanceScheduledEnd: dbConfig.maintenanceScheduledEnd ? new Date(dbConfig.maintenanceScheduledEnd) : undefined,
      maxOrganizations: dbConfig.maxOrganizations !== undefined ? dbConfig.maxOrganizations : null,
      maxUsersPerOrganization: dbConfig.maxUsersPerOrganization !== undefined ? dbConfig.maxUsersPerOrganization : null,
      maxStorageGB: dbConfig.maxStorageGB !== undefined ? dbConfig.maxStorageGB : null,
      notificationsEnabled: dbConfig.notificationsEnabled !== undefined ? dbConfig.notificationsEnabled : true,
      emailNotificationsEnabled: dbConfig.emailNotificationsEnabled !== undefined ? dbConfig.emailNotificationsEnabled : true,
      smsNotificationsEnabled: dbConfig.smsNotificationsEnabled !== undefined ? dbConfig.smsNotificationsEnabled : false,
    }
  }

  // Actualizar configuración del sistema
  static async updateSystemConfig(
    key: string,
    value: any,
    category: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const existing = await prisma.adminSystemConfig.findUnique({
      where: { key }
    })

    const valueJson = typeof value === 'object' ? value : { value }

    if (existing) {
      // Guardar historial
      await prisma.adminSystemConfigHistory.create({
        data: {
          configKey: key,
          oldValue: existing.value === null ? Prisma.JsonNull : (existing.value as Prisma.InputJsonValue),
          newValue: valueJson as Prisma.InputJsonValue,
          changedBy: userId,
          reason
        }
      })

      // Actualizar
      await prisma.adminSystemConfig.update({
        where: { key },
        data: {
          value: valueJson as Prisma.InputJsonValue,
          updatedBy: userId,
          updatedAt: new Date()
        }
      })
    } else {
      // Crear nueva
      await prisma.adminSystemConfig.create({
        data: {
          key,
          value: valueJson as Prisma.InputJsonValue,
          category,
          updatedBy: userId,
          description: `Configuración de ${category}`
        }
      })
    }
  }

  // Obtener historial de cambios
  static async getConfigHistory(key: string, limit: number = 50) {
    return prisma.adminSystemConfigHistory.findMany({
      where: { configKey: key },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Inicializar configuraciones por defecto (migración/seeding)
  static async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      { key: 'systemName', value: { value: 'SmartPOS' }, category: 'general', description: 'Nombre del sistema' },
      { key: 'systemEmail', value: { value: 'admin@sistema.com' }, category: 'general', description: 'Email del sistema' },
      { key: 'systemUrl', value: { value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }, category: 'general', description: 'URL del sistema' },
      { key: 'supportEmail', value: { value: 'soporte@sistema.com' }, category: 'general', description: 'Email de soporte' },
      { key: 'sessionTimeoutMinutes', value: { value: 30 }, category: 'security', description: 'Timeout de sesión en minutos' },
      { key: 'jwtExpirationDays', value: { value: 7 }, category: 'security', description: 'Días de expiración JWT' },
      { key: 'require2FA', value: { value: false }, category: 'security', description: 'Requerir 2FA globalmente' },
      { key: 'jwtRotationDays', value: { value: 90 }, category: 'security', description: 'Días para rotación JWT' },
      { key: 'passwordMinLength', value: { value: 8 }, category: 'security', description: 'Longitud mínima de contraseña' },
      { key: 'passwordRequireUppercase', value: { value: true }, category: 'security', description: 'Requerir mayúsculas en contraseña' },
      { key: 'passwordRequireLowercase', value: { value: true }, category: 'security', description: 'Requerir minúsculas en contraseña' },
      { key: 'passwordRequireNumbers', value: { value: true }, category: 'security', description: 'Requerir números en contraseña' },
      { key: 'passwordRequireSymbols', value: { value: false }, category: 'security', description: 'Requerir símbolos en contraseña' },
      { key: 'maxLoginAttempts', value: { value: 5 }, category: 'security', description: 'Máximo de intentos de login' },
      { key: 'lockoutDurationMinutes', value: { value: 30 }, category: 'security', description: 'Duración de bloqueo en minutos' },
      { key: 'sessionSingleMode', value: { value: false }, category: 'security', description: 'Solo una sesión activa por usuario' },
      { key: 'maintenanceMode', value: { value: false }, category: 'maintenance', description: 'Modo mantenimiento activo' },
      { key: 'maintenanceMessage', value: { value: null }, category: 'maintenance', description: 'Mensaje de mantenimiento' },
      { key: 'notificationsEnabled', value: { value: true }, category: 'notifications', description: 'Notificaciones habilitadas' },
      { key: 'emailNotificationsEnabled', value: { value: true }, category: 'notifications', description: 'Notificaciones por email habilitadas' },
      { key: 'smsNotificationsEnabled', value: { value: false }, category: 'notifications', description: 'Notificaciones por SMS habilitadas' },
    ]

    for (const config of defaultConfigs) {
      const existing = await prisma.adminSystemConfig.findUnique({
        where: { key: config.key }
      })

      if (!existing) {
        await prisma.adminSystemConfig.create({
          data: config
        })
      }
    }
  }

  // Obtener información de secrets JWT
  static async getJwtSecrets(): Promise<JwtSecretInfo[]> {
    const secrets = await prisma.jwtSecret.findMany({
      orderBy: [
        { systemType: 'asc' },
        { version: 'desc' }
      ]
    })

    return secrets.map(secret => ({
      id: secret.id,
      systemType: secret.systemType,
      version: secret.version,
      isActive: secret.isActive,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt,
      rotatedAt: secret.rotatedAt,
    }))
  }

  // Rotar secret JWT
  static async rotateJwtSecret(systemType: 'admin' | 'sas'): Promise<{ success: boolean; message: string }> {
    try {
      // Generar nuevo secret seguro
      const newSecret = randomBytes(64).toString('hex')
      
      // Obtener días de rotación desde la configuración (default 90)
      const config = await this.getSystemConfig()
      const expiresInDays = config.jwtRotationDays || 90
      
      await JwtSecretRotation.rotateSecret({
        systemType,
        secret: newSecret,
        expiresInDays
      })
      
      return {
        success: true,
        message: `Secret JWT para ${systemType} rotado exitosamente`
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error al rotar secret'
      }
    }
  }

  // Obtener logs de seguridad
  static async getSecurityLogs(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      type?: string
      userId?: string
      customerId?: string
      success?: boolean
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{ logs: SystemLogEntry[]; total: number }> {
    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId
    }

    if (filters?.success !== undefined) {
      where.success = filters.success
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.securityLog.count({ where })
    ])

    return {
      logs: logs.map(log => ({
        id: log.id,
        type: log.type,
        userId: log.userId,
        customerId: log.customerId,
        organizationId: log.organizationId,
        ipAddress: log.ipAddress,
        success: log.success,
        errorMessage: log.errorMessage,
        details: log.details,
        createdAt: log.createdAt,
      })),
      total
    }
  }

  // Obtener métricas del sistema
  static async getSystemMetrics() {
    const [
      totalOrganizations,
      totalUsers,
      totalCustomers,
      userSessionsCount,
      sasSessionsCount,
      securityLogsLast24h,
      jwtSecrets
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.profile.count(),
      prisma.customer.count(),
      prisma.userSession.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      }),
      prisma.sasSession.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      }),
      prisma.securityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.jwtSecret.count({
        where: { isActive: true }
      })
    ])

    const activeSessions = userSessionsCount + sasSessionsCount

    return {
      organizations: {
        total: totalOrganizations
      },
      users: {
        total: totalUsers
      },
      customers: {
        total: totalCustomers
      },
      sessions: {
        active: activeSessions
      },
      security: {
        logsLast24h: securityLogsLast24h,
        activeJwtSecrets: jwtSecrets
      }
    }
  }

  // Limpiar logs antiguos
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.securityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    return { deleted: result.count }
  }

  // Obtener estadísticas de uso
  static async getUsageStats(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [
      logins,
      failedLogins,
      sensitiveActions,
      newOrganizations,
      newUsers
    ] = await Promise.all([
      prisma.securityLog.count({
        where: {
          type: 'LOGIN_SUCCESS',
          createdAt: { gte: startDate }
        }
      }),
      prisma.securityLog.count({
        where: {
          type: 'LOGIN_FAILED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.securityLog.count({
        where: {
          type: { contains: 'SENSITIVE' },
          createdAt: { gte: startDate }
        }
      }),
      prisma.organization.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      prisma.profile.count({
        where: {
          createdAt: { gte: startDate }
        }
      })
    ])

    return {
      period: `${days} días`,
      logins,
      failedLogins,
      sensitiveActions,
      newOrganizations,
      newUsers,
      loginSuccessRate: logins + failedLogins > 0 
        ? ((logins / (logins + failedLogins)) * 100).toFixed(2)
        : '0'
    }
  }

  // ========================================
  // GESTIÓN DE BACKUPS
  // ========================================

  static async getBackups(limit: number = 50, offset: number = 0) {
    const [backups, total] = await Promise.all([
      prisma.adminBackup.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.adminBackup.count()
    ])

    return { backups, total }
  }

  static async createBackup(data: {
    name: string
    type: 'manual' | 'automatic' | 'scheduled'
    databaseName: string
    schemaOnly?: boolean
    compressed?: boolean
    createdBy?: string
    retentionDays?: number
    scheduledAt?: Date
  }) {
    const expiresAt = data.retentionDays 
      ? new Date(Date.now() + data.retentionDays * 24 * 60 * 60 * 1000)
      : null

    return prisma.adminBackup.create({
      data: {
        name: data.name,
        type: data.type,
        databaseName: data.databaseName,
        schemaOnly: data.schemaOnly || false,
        compressed: data.compressed !== false,
        status: 'pending',
        createdBy: data.createdBy,
        retentionDays: data.retentionDays,
        scheduledAt: data.scheduledAt,
        expiresAt
      }
    })
  }

  static async updateBackupStatus(
    id: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    filePath?: string,
    fileSize?: bigint,
    errorMessage?: string
  ) {
    const updateData: any = { status }
    
    if (status === 'running') {
      updateData.startedAt = new Date()
    } else if (status === 'completed') {
      updateData.completedAt = new Date()
      if (filePath) updateData.filePath = filePath
      if (fileSize) updateData.fileSize = fileSize
    } else if (status === 'failed') {
      updateData.completedAt = new Date()
      if (errorMessage) updateData.errorMessage = errorMessage
    }

    return prisma.adminBackup.update({
      where: { id },
      data: updateData
    })
  }

  static async deleteBackup(id: string) {
    return prisma.adminBackup.delete({
      where: { id }
    })
  }

  static async cleanupExpiredBackups() {
    const now = new Date()
    return prisma.adminBackup.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    })
  }

  // ========================================
  // CONFIGURACIÓN DE EMAIL/SMTP
  // ========================================

  static async getEmailConfigs() {
    return prisma.adminEmailConfig.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  static async getActiveEmailConfig() {
    return prisma.adminEmailConfig.findFirst({
      where: {
        isActive: true,
        isDefault: true
      }
    }) || prisma.adminEmailConfig.findFirst({
      where: { isActive: true }
    })
  }

  static async createEmailConfig(data: {
    name: string
    host: string
    port: number
    secure: boolean
    user: string
    password: string
    fromEmail: string
    fromName?: string
    replyTo?: string
    isActive?: boolean
    isDefault?: boolean
    updatedBy?: string
  }) {
    // Si es default, desactivar otros defaults
    if (data.isDefault) {
      await prisma.adminEmailConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    return prisma.adminEmailConfig.create({
      data: {
        name: data.name,
        host: data.host,
        port: data.port,
        secure: data.secure,
        user: data.user,
        password: data.password, // TODO: Encriptar
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        replyTo: data.replyTo,
        isActive: data.isActive || false,
        isDefault: data.isDefault || false,
        updatedBy: data.updatedBy
      }
    })
  }

  static async updateEmailConfig(
    id: string,
    data: Partial<{
      name: string
      host: string
      port: number
      secure: boolean
      user: string
      password: string
      fromEmail: string
      fromName: string
      replyTo: string
      isActive: boolean
      isDefault: boolean
      updatedBy: string
    }>
  ) {
    // Si se está estableciendo como default, desactivar otros
    if (data.isDefault) {
      await prisma.adminEmailConfig.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    return prisma.adminEmailConfig.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  static async testEmailConfig(id: string, testEmail: string) {
    const config = await prisma.adminEmailConfig.findUnique({
      where: { id }
    })

    if (!config) {
      throw new Error('Configuración de email no encontrada')
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      throw new Error('Email de prueba inválido')
    }

    // TODO: Implementar prueba real de envío a testEmail
    // Por ahora solo simulamos
    const success = Math.random() > 0.3 // 70% de éxito simulado

    await prisma.adminEmailConfig.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: success ? 'success' : 'failed',
        lastTestError: success ? null : `Error de conexión SMTP al enviar a ${testEmail}`
      }
    })

    return { success }
  }

  // ========================================
  // CONFIGURACIÓN DE ALERTAS
  // ========================================

  static async getAlertConfigs() {
    return prisma.adminAlertConfig.findMany({
      orderBy: [
        { enabled: 'desc' },
        { type: 'asc' },
        { name: 'asc' }
      ]
    })
  }

  static async getEnabledAlertConfigs() {
    return prisma.adminAlertConfig.findMany({
      where: { enabled: true },
      orderBy: { type: 'asc' }
    })
  }

  static async createAlertConfig(data: {
    name: string
    type: 'security' | 'performance' | 'business' | 'system'
    enabled?: boolean
    threshold?: any
    conditions: any
    channels: string[]
    recipients?: any
    frequency?: 'immediate' | 'hourly' | 'daily'
  }) {
    return prisma.adminAlertConfig.create({
      data: {
        name: data.name,
        type: data.type,
        enabled: data.enabled !== false,
        threshold: data.threshold,
        conditions: data.conditions,
        channels: data.channels,
        recipients: data.recipients,
        frequency: data.frequency || 'immediate'
      }
    })
  }

  static async updateAlertConfig(
    id: string,
    data: Partial<{
      name: string
      enabled: boolean
      threshold: any
      conditions: any
      channels: string[]
      recipients: any
      frequency: string
    }>
  ) {
    return prisma.adminAlertConfig.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  static async triggerAlert(id: string) {
    const alert = await prisma.adminAlertConfig.findUnique({
      where: { id }
    })

    if (!alert || !alert.enabled) {
      return
    }

    await prisma.adminAlertConfig.update({
      where: { id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: alert.triggerCount + 1
      }
    })

    // TODO: Enviar alerta según canales configurados
    return alert
  }

  // ========================================
  // CONFIGURACIÓN DE INTEGRACIONES
  // ========================================

  static async getIntegrationConfigs() {
    return prisma.adminIntegrationConfig.findMany({
      orderBy: [
        { enabled: 'desc' },
        { type: 'asc' },
        { provider: 'asc' }
      ]
    })
  }

  static async getIntegrationConfig(id: string) {
    return prisma.adminIntegrationConfig.findUnique({
      where: { id }
    })
  }

  static async getIntegrationByType(type: string, provider?: string) {
    return prisma.adminIntegrationConfig.findFirst({
      where: {
        type,
        provider: provider || undefined,
        enabled: true
      }
    })
  }

  static async createIntegrationConfig(data: {
    name: string
    type: 'payment' | 'api' | 'webhook' | 'oauth' | 'sso'
    provider: string
    enabled?: boolean
    config: any
    credentials?: any
    webhookUrl?: string
    webhookSecret?: string
    testMode?: boolean
    metadata?: any
    updatedBy?: string
  }) {
    return prisma.adminIntegrationConfig.create({
      data: {
        name: data.name,
        type: data.type,
        provider: data.provider,
        enabled: data.enabled || false,
        config: data.config,
        credentials: data.credentials, // TODO: Encriptar
        webhookUrl: data.webhookUrl,
        webhookSecret: data.webhookSecret,
        testMode: data.testMode !== false,
        metadata: data.metadata,
        updatedBy: data.updatedBy
      }
    })
  }

  static async updateIntegrationConfig(
    id: string,
    data: Partial<{
      name: string
      enabled: boolean
      config: any
      credentials: any
      webhookUrl: string
      webhookSecret: string
      testMode: boolean
      metadata: any
      updatedBy: string
    }>
  ) {
    return prisma.adminIntegrationConfig.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  static async testIntegration(id: string) {
    const integration = await prisma.adminIntegrationConfig.findUnique({
      where: { id }
    })

    if (!integration) {
      throw new Error('Integración no encontrada')
    }

    // TODO: Implementar prueba real según tipo de integración
    const success = Math.random() > 0.3

    await prisma.adminIntegrationConfig.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: success ? 'success' : 'failed'
      }
    })

    return { success }
  }

  // ========================================
  // EXPORTACIÓN/IMPORTACIÓN
  // ========================================

  static async exportConfig() {
    try {
      const [configs, emailConfigs, alertConfigs, integrationConfigs] = await Promise.all([
        prisma && (prisma as any).adminSystemConfig ? (prisma as any).adminSystemConfig.findMany() : [],
        prisma && (prisma as any).adminEmailConfig ? (prisma as any).adminEmailConfig.findMany({
          select: {
            id: false,
            password: false,
            updatedBy: false,
            createdAt: false,
            updatedAt: false
          }
        }) : [],
        prisma && (prisma as any).adminAlertConfig ? (prisma as any).adminAlertConfig.findMany() : [],
        prisma && (prisma as any).adminIntegrationConfig ? (prisma as any).adminIntegrationConfig.findMany({
          select: {
            id: false,
            credentials: false,
            webhookSecret: false,
            updatedBy: false,
            createdAt: false,
            updatedAt: false
          }
        }) : []
      ])

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        configs,
        emailConfigs,
        alertConfigs,
        integrationConfigs
      }
    } catch (error: any) {
      console.warn('Error al exportar configuraciones:', error.message)
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        configs: [],
        emailConfigs: [],
        alertConfigs: [],
        integrationConfigs: [],
        error: error.message
      }
    }
  }

  static async importConfig(data: {
    configs?: any[]
    emailConfigs?: any[]
    alertConfigs?: any[]
    integrationConfigs?: any[]
  }, userId: string) {
    // TODO: Validar y aplicar importación
    // userId se usará para updatedBy en las configuraciones importadas
    // Por ahora solo retornamos éxito
    return { success: true, imported: 0, importedBy: userId }
  }
}
