/**
 * Cron Job para Limpieza Automática de Sesiones - Sistema de Autenticación Empresarial
 * 
 * Ejecuta limpieza periódica de:
 * - Sesiones expiradas
 * - Tokens invalidados antiguos
 * - Intentos de refresh antiguos
 * - Logs de cambio de contraseña antiguos
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      logger.error('CRON_SECRET no configurado')
      return NextResponse.json(
        { error: 'Configuración de cron no válida' },
        { status: 500 }
      )
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: 'Token de autorización inválido' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    const results = {
      expiredSessions: 0,
      invalidatedTokens: 0,
      oldRefreshAttempts: 0,
      oldPasswordChangeLogs: 0,
      totalProcessingTime: 0,
    }

    // 1. Limpiar sesiones expiradas
    const expiredSessionsResult = await EnhancedTokenService.cleanupExpiredSessions()
    results.expiredSessions = expiredSessionsResult

    // 2. Limpiar tokens invalidados expirados (más de 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const invalidatedTokensResult = await prisma.invalidatedToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
    results.invalidatedTokens = invalidatedTokensResult.count

    // 3. Limpiar intentos de refresh antiguos (más de 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const oldRefreshAttemptsResult = await prisma.refreshAttempt.deleteMany({
      where: {
        attemptedAt: { lt: sevenDaysAgo }
      }
    })
    results.oldRefreshAttempts = oldRefreshAttemptsResult.count

    // 4. Limpiar logs de cambio de contraseña antiguos (más de 90 días)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const oldPasswordChangeLogsResult = await prisma.passwordChangeLog.deleteMany({
      where: {
        changedAt: { lt: ninetyDaysAgo }
      }
    })
    results.oldPasswordChangeLogs = oldPasswordChangeLogsResult.count

    // 5. Estadísticas adicionales
    const [
      totalActiveSessions,
      totalActiveUsers,
      totalOrganizations,
      recentRefreshAttempts,
      suspiciousActivity
    ] = await Promise.all([
      // Sesiones activas totales
      prisma.enhancedSession.count({
        where: { isActive: true }
      }),

      // Usuarios únicos con sesiones activas
      prisma.enhancedSession.groupBy({
        by: ['userId'],
        where: { isActive: true },
      }).then(groups => groups.length),

      // Organizaciones con sesiones activas
      prisma.enhancedSession.groupBy({
        by: ['organizationId'],
        where: { isActive: true },
      }).then(groups => groups.length),

      // Intentos de refresh en las últimas 24h
      prisma.refreshAttempt.count({
        where: {
          attemptedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),

      // Actividad sospechosa (múltiples IPs, muchos refreshes, etc.)
      prisma.enhancedSession.count({
        where: {
          OR: [
            { refreshCount: { gt: 100 } }, // Más de 100 refreshes
            { 
              AND: [
                { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                { refreshCount: { gt: 50 } } // Más de 50 refreshes en 24h
              ]
            }
          ]
        }
      })
    ])

    results.totalProcessingTime = Date.now() - startTime

    // Log de la limpieza
    logger.info('Limpieza automática de sesiones completada', {
      results,
      statistics: {
        totalActiveSessions,
        totalActiveUsers,
        totalOrganizations,
        recentRefreshAttempts,
        suspiciousActivity,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Limpieza automática completada exitosamente',
      results,
      statistics: {
        totalActiveSessions,
        totalActiveUsers,
        totalOrganizations,
        recentRefreshAttempts,
        suspiciousActivity,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('Error en limpieza automática de sesiones', error as Error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno durante la limpieza',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// También permitir POST para flexibilidad
export async function POST(request: NextRequest) {
  return GET(request)
}