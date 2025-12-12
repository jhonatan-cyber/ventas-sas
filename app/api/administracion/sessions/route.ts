/**
 * API de Gestión de Sesiones para Administradores
 * 
 * Permite a los administradores ver todas las sesiones activas del sistema
 */

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const adminToken = request.cookies.get('admin-auth-token')?.value
    if (!adminToken) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // TODO: Verificar que el token de admin sea válido
    // Por ahora, asumimos que si tiene la cookie, está autenticado

    // Obtener todas las sesiones activas con información del usuario y organización
    const sessions = await prisma.enhancedSession.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            ci: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    })

    // Formatear datos para el frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      userName: `${session.user.nombre} ${session.user.apellido}`.trim(),
      userEmail: session.user.email || session.user.ci || 'Sin email',
      organizationId: session.organizationId,
      organizationName: session.organization.name,
      organizationSlug: session.organization.slug,
      deviceName: session.deviceName,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      refreshCount: session.refreshCount,
      isActive: session.isActive,
    }))

    // Calcular estadísticas
    const uniqueUsers = new Set(sessions.map(s => s.userId))
    const uniqueOrganizations = new Set(sessions.map(s => s.organizationId))
    const totalRefreshes = sessions.reduce((sum, s) => sum + s.refreshCount, 0)
    
    // Sesiones con actividad sospechosa (más de 10 refreshes o múltiples IPs)
    const suspiciousActivity = sessions.filter(s => 
      s.refreshCount > 10 || 
      sessions.filter(other => other.userId === s.userId && other.ipAddress !== s.ipAddress).length > 0
    ).length

    const statistics = {
      totalActiveSessions: sessions.length,
      totalActiveUsers: uniqueUsers.size,
      totalOrganizations: uniqueOrganizations.size,
      recentRefreshAttempts: totalRefreshes,
      suspiciousActivity,
      averageSessionsPerUser: uniqueUsers.size > 0 ? sessions.length / uniqueUsers.size : 0
    }

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      statistics,
      total: formattedSessions.length,
    })

  } catch (error) {
    logger.error('Error obteniendo sesiones para administración', error as Error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}