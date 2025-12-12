/**
 * Servicio de Notificaciones de Sesión
 * 
 * Notifica a usuarios sobre actividad de sesiones y eventos de seguridad
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { geolocationService } from '@/lib/utils/ip-geolocation'

interface SessionNotificationData {
  userId: string
  organizationId: string
  sessionId: string
  deviceInfo?: {
    browser?: string
    os?: string
    device?: string
  }
  ipAddress?: string
  location?: {
    city?: string
    country?: string
    countryCode?: string
  }
  timestamp: Date
}

interface SecurityAlertData {
  userId: string
  organizationId: string
  alertType: 'suspicious_login' | 'device_mismatch' | 'multiple_failures' | 'tor_access' | 'vpn_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export class SessionNotificationService {
  /**
   * Notifica sobre nueva sesión iniciada
   */
  static async notifyNewSession(data: SessionNotificationData): Promise<void> {
    if (process.env.ENABLE_SESSION_NOTIFICATIONS !== 'true') {
      return
    }

    try {
      // Obtener información del usuario
      const user = await prisma.usuarioSas.findUnique({
        where: { id: data.userId },
        select: {
          nombre: true,
          apellido: true,
          email: true,
          organization: {
            select: {
              name: true,
              razonSocial: true,
            }
          }
        }
      })

      if (!user || !user.email) {
        return
      }

      // Obtener información de geolocalización
      let locationInfo = ''
      if (data.ipAddress) {
        const geo = await geolocationService.lookup(data.ipAddress)
        if (geo) {
          locationInfo = [geo.city, geo.region, geo.country]
            .filter(Boolean)
            .join(', ')
        }
      }

      // Crear notificación en base de datos
      await prisma.notification.create({
        data: {
          type: 'new_session',
          title: 'Nueva sesión iniciada',
          message: this.buildNewSessionMessage(data, locationInfo),
          data: {
            sessionId: data.sessionId,
            deviceInfo: data.deviceInfo,
            ipAddress: data.ipAddress,
            location: locationInfo,
          },
          usuarioSasId: data.userId,
          organizationId: data.organizationId,
        }
      })

      // Enviar email si está configurado
      await this.sendNewSessionEmail(user, data, locationInfo)

      // Webhook si está configurado
      await this.sendNewSessionWebhook(data, locationInfo)

      logger.info('Notificación de nueva sesión enviada', {
        userId: data.userId,
        sessionId: data.sessionId,
        hasLocation: !!locationInfo,
      })

    } catch (error) {
      logger.error('Error enviando notificación de nueva sesión', error as Error, {
        userId: data.userId,
        sessionId: data.sessionId,
      })
    }
  }

  /**
   * Notifica sobre actividad sospechosa
   */
  static async notifySecurityAlert(data: SecurityAlertData): Promise<void> {
    try {
      // Obtener información del usuario
      const user = await prisma.usuarioSas.findUnique({
        where: { id: data.userId },
        select: {
          nombre: true,
          apellido: true,
          email: true,
          organization: {
            select: {
              name: true,
              razonSocial: true,
            }
          }
        }
      })

      if (!user) {
        return
      }

      // Crear notificación de seguridad
      await prisma.notification.create({
        data: {
          type: 'security_alert',
          title: this.getSecurityAlertTitle(data.alertType),
          message: this.buildSecurityAlertMessage(data),
          data: {
            alertType: data.alertType,
            severity: data.severity,
            details: data.details,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          },
          usuarioSasId: data.userId,
          organizationId: data.organizationId,
        }
      })

      // Enviar email para alertas críticas
      if (data.severity === 'critical' || data.severity === 'high') {
        await this.sendSecurityAlertEmail(user, data)
      }

      // Webhook para actividad sospechosa
      await this.sendSecurityAlertWebhook(data)

      logger.security('Alerta de seguridad enviada', {
        userId: data.userId,
        alertType: data.alertType,
        severity: data.severity,
        ipAddress: data.ipAddress,
      })

    } catch (error) {
      logger.error('Error enviando alerta de seguridad', error as Error, {
        userId: data.userId,
        alertType: data.alertType,
      })
    }
  }

  /**
   * Notifica sobre sesión terminada remotamente
   */
  static async notifySessionTerminated(
    userId: string,
    organizationId: string,
    sessionId: string,
    reason: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          type: 'session_terminated',
          title: 'Sesión terminada',
          message: `Tu sesión fue terminada: ${reason}`,
          data: {
            sessionId,
            reason,
            terminatedAt: new Date().toISOString(),
          },
          usuarioSasId: userId,
          organizationId,
        }
      })

      logger.info('Notificación de sesión terminada enviada', {
        userId,
        sessionId,
        reason,
      })

    } catch (error) {
      logger.error('Error enviando notificación de sesión terminada', error as Error, {
        userId,
        sessionId,
      })
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private static buildNewSessionMessage(
    data: SessionNotificationData,
    location: string
  ): string {
    const device = data.deviceInfo 
      ? `${data.deviceInfo.browser || 'Navegador'} en ${data.deviceInfo.os || 'Sistema'}`
      : 'Dispositivo desconocido'
    
    const locationText = location ? ` desde ${location}` : ''
    const timeText = data.timestamp.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    return `Se inició una nueva sesión en ${device}${locationText} el ${timeText}.`
  }

  private static buildSecurityAlertMessage(data: SecurityAlertData): string {
    const timeText = data.timestamp.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    switch (data.alertType) {
      case 'suspicious_login':
        return `Se detectó un intento de login sospechoso el ${timeText}.`
      case 'device_mismatch':
        return `Se detectó acceso desde un dispositivo no reconocido el ${timeText}.`
      case 'multiple_failures':
        return `Se detectaron múltiples intentos de login fallidos el ${timeText}.`
      case 'tor_access':
        return `Se detectó acceso desde la red Tor el ${timeText}.`
      case 'vpn_access':
        return `Se detectó acceso desde VPN/Proxy el ${timeText}.`
      default:
        return `Se detectó actividad sospechosa el ${timeText}.`
    }
  }

  private static getSecurityAlertTitle(alertType: SecurityAlertData['alertType']): string {
    switch (alertType) {
      case 'suspicious_login':
        return 'Login sospechoso detectado'
      case 'device_mismatch':
        return 'Dispositivo no reconocido'
      case 'multiple_failures':
        return 'Múltiples intentos fallidos'
      case 'tor_access':
        return 'Acceso desde Tor detectado'
      case 'vpn_access':
        return 'Acceso desde VPN detectado'
      default:
        return 'Actividad sospechosa'
    }
  }

  private static async sendNewSessionEmail(
    user: any,
    data: SessionNotificationData,
    location: string
  ): Promise<void> {
    // Implementar envío de email
    // Por ahora solo log
    logger.info('Email de nueva sesión (no implementado)', {
      email: user.email,
      location,
      device: data.deviceInfo,
    })
  }

  private static async sendSecurityAlertEmail(
    user: any,
    data: SecurityAlertData
  ): Promise<void> {
    // Implementar envío de email de alerta
    logger.info('Email de alerta de seguridad (no implementado)', {
      email: user.email,
      alertType: data.alertType,
      severity: data.severity,
    })
  }

  private static async sendNewSessionWebhook(
    data: SessionNotificationData,
    location: string
  ): Promise<void> {
    const webhookUrl = process.env.WEBHOOK_URL_NEW_SESSION
    if (!webhookUrl) return

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Enhanced-Auth-System/1.0',
        },
        body: JSON.stringify({
          event: 'new_session',
          userId: data.userId,
          organizationId: data.organizationId,
          sessionId: data.sessionId,
          deviceInfo: data.deviceInfo,
          ipAddress: data.ipAddress,
          location,
          timestamp: data.timestamp.toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      })
    } catch (error) {
      logger.error('Error enviando webhook de nueva sesión', error as Error)
    }
  }

  private static async sendSecurityAlertWebhook(data: SecurityAlertData): Promise<void> {
    const webhookUrl = process.env.WEBHOOK_URL_SUSPICIOUS_ACTIVITY
    if (!webhookUrl) return

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Enhanced-Auth-System/1.0',
        },
        body: JSON.stringify({
          event: 'security_alert',
          userId: data.userId,
          organizationId: data.organizationId,
          alertType: data.alertType,
          severity: data.severity,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: data.timestamp.toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      })
    } catch (error) {
      logger.error('Error enviando webhook de alerta de seguridad', error as Error)
    }
  }
}