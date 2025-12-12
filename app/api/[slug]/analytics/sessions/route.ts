/**
 * GET /api/[slug]/analytics/sessions
 * 
 * Endpoint para obtener analytics de sesiones por organización
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { getOrganizationBySlug } from '@/lib/utils/organization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug de organización no proporcionado' },
        { status: 400 }
      )
    }

    // Verificar organización
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    // Verificar autenticación
    const accessToken = request.cookies.get('sas-auth-token')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const payload = await EnhancedTokenService.verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Calcular rango de fechas
    const now = new Date()
    const daysBack = parseInt(range.replace('d', '')) || 7
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Obtener métricas principales
    const [
      totalActiveSessions,
      totalUsers,
      newSessionsToday,
      suspiciousActivityCount
    ] = await Promise.all([
      prisma.enhancedSession.count({
        where: {
          organizationId: organization.id,
          isActive: true,
        }
      }),
      prisma.usuarioSas.count({
        where: {
          organizationId: organization.id,
          isActive: true,
        }
      }),
      prisma.enhancedSession.count({
        where: {
          organizationId: organization.id,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          }
        }
      }),
      prisma.securityLog.count({
        where: {
          organizationId: organization.id,
          createdAt: {
            gte: startDate,
          },
          type: {
            in: ['SUSPICIOUS_LOGIN', 'DEVICE_MISMATCH', 'MULTIPLE_FAILURES']
          }
        }
      })
    ])

    // Calcular promedio de sesiones por usuario
    const averageSessionsPerUser = totalUsers > 0 ? totalActiveSessions / totalUsers : 0

    // Obtener datos de tendencias diarias
    const dailyLogins = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM enhanced_sessions 
      WHERE organization_id = ${organization.id}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    // Obtener actividad por hora
    const hourlyActivity = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM last_activity_at) as hour,
        COUNT(*) as count
      FROM enhanced_sessions 
      WHERE organization_id = ${organization.id}
        AND last_activity_at >= ${startDate}
        AND is_active = true
      GROUP BY EXTRACT(HOUR FROM last_activity_at)
      ORDER BY hour ASC
    ` as Array<{ hour: number; count: bigint }>

    // Obtener intentos fallidos
    const failedAttempts = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM system_security_logs 
      WHERE organization_id = ${organization.id}
        AND created_at >= ${startDate}
        AND success = false
        AND type LIKE '%LOGIN%'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    // Obtener estadísticas de dispositivos
    const deviceStats = await prisma.enhancedSession.findMany({
      where: {
        organizationId: organization.id,
        createdAt: {
          gte: startDate,
        }
      },
      select: {
        deviceInfo: true,
      }
    })

    // Procesar estadísticas de dispositivos
    const browserStats = new Map<string, number>()
    const osStats = new Map<string, number>()
    const deviceTypes = new Map<string, number>()

    deviceStats.forEach(session => {
      const info = session.deviceInfo as any
      if (info) {
        // Navegadores
        const browser = info.browser || 'Desconocido'
        browserStats.set(browser, (browserStats.get(browser) || 0) + 1)

        // Sistemas operativos
        const os = info.os || 'Desconocido'
        osStats.set(os, (osStats.get(os) || 0) + 1)

        // Tipos de dispositivo (simplificado)
        const deviceType = info.os?.includes('Android') || info.os?.includes('iOS') ? 'Móvil' : 'Desktop'
        deviceTypes.set(deviceType, (deviceTypes.get(deviceType) || 0) + 1)
      }
    })

    // Obtener top países (simulado - requiere geolocalización)
    const topCountries = [
      { country: 'Bolivia', count: Math.floor(totalActiveSessions * 0.7) },
      { country: 'Argentina', count: Math.floor(totalActiveSessions * 0.2) },
      { country: 'Chile', count: Math.floor(totalActiveSessions * 0.1) },
    ]

    // Obtener top dispositivos
    const topDevices = Array.from(browserStats.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Obtener actividad sospechosa por tipo
    const suspiciousActivity = await prisma.$queryRaw`
      SELECT 
        type,
        COUNT(*) as count,
        'medium' as severity
      FROM system_security_logs 
      WHERE organization_id = ${organization.id}
        AND created_at >= ${startDate}
        AND type IN ('SUSPICIOUS_LOGIN', 'DEVICE_MISMATCH', 'MULTIPLE_FAILURES')
      GROUP BY type
      ORDER BY count DESC
    ` as Array<{ type: string; count: bigint; severity: string }>

    // Formatear datos para el frontend
    const analytics = {
      overview: {
        totalActiveSessions,
        totalUsers,
        averageSessionsPerUser: Number(averageSessionsPerUser.toFixed(2)),
        newSessionsToday,
        suspiciousActivityCount,
        topCountries,
        topDevices,
      },
      trends: {
        dailyLogins: dailyLogins.map(item => ({
          date: item.date.toISOString().split('T')[0],
          count: Number(item.count),
        })),
        hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: Number(hourlyActivity.find(h => h.hour === hour)?.count || 0),
        })),
        weeklyTrends: [], // Implementar si es necesario
      },
      security: {
        failedAttempts: failedAttempts.map(item => ({
          date: item.date.toISOString().split('T')[0],
          count: Number(item.count),
        })),
        blockedIPs: [], // Implementar con sistema de IPs bloqueadas
        suspiciousActivity: suspiciousActivity.map(item => ({
          type: item.type,
          count: Number(item.count),
          severity: item.severity,
        })),
      },
      devices: {
        browserStats: Array.from(browserStats.entries()).map(([name, value]) => ({ name, value })),
        osStats: Array.from(osStats.entries()).map(([name, value]) => ({ name, value })),
        deviceTypes: Array.from(deviceTypes.entries()).map(([name, value]) => ({ name, value })),
      },
    }

    return NextResponse.json({
      success: true,
      analytics,
      generatedAt: new Date().toISOString(),
      range,
    })

  } catch (error) {
    logger.error('Error obteniendo analytics de sesiones', error as Error, {
      slug: (await params).slug,
    })
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}