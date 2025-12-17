/**
 * API de Estado de Autenticación - Sistema de Autenticación Empresarial
 * 
 * Verifica el estado actual de autenticación del usuario
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug de organización no proporcionado' },
        { status: 400 }
      )
    }

    // Obtener access token de las cookies
    const accessToken = request.cookies.get("sas-auth-token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { 
          isAuthenticated: false,
          error: 'Token de acceso no encontrado' 
        },
        { status: 401 }
      )
    }

    // Verificar access token
    const payload = await EnhancedTokenService.verifyAccessToken(accessToken)

    if (!payload) {
      return NextResponse.json(
        { 
          isAuthenticated: false,
          error: 'Token de acceso inválido o expirado' 
        },
        { status: 401 }
      )
    }

    // Obtener información del usuario y sesión
    const user = await prisma.usuarioSas.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        isActive: true,
        rol: {
          select: {
            id: true,
            nombre: true,
            permissions: true,
          }
        },
        sucursal: {
          select: {
            id: true,
            name: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { 
          isAuthenticated: false,
          error: 'Usuario no encontrado o inactivo' 
        },
        { status: 401 }
      )
    }

    // Obtener información de la sesión
    const session = await prisma.enhancedSession.findUnique({
      where: { id: payload.sessionId },
      select: {
        id: true,
        deviceName: true,
        deviceInfo: true,
        lastActivityAt: true,
        expiresAt: true,
        refreshCount: true,
      }
    })

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        fullName: `${user.nombre} ${user.apellido}`,
        email: user.email,
        rol: user.rol,
        sucursal: user.sucursal,
        organization: user.organization,
      },
      session: session ? {
        id: session.id,
        deviceName: session.deviceName,
        deviceInfo: session.deviceInfo,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        refreshCount: session.refreshCount,
      } : null,
      expiresAt: new Date(payload.exp! * 1000).toISOString(),
      timeUntilExpiry: (payload.exp! * 1000) - Date.now(),
    })

  } catch (error) {
    logger.error('Error verificando estado de autenticación', error as Error, {
      endpoint: '/api/[slug]/auth/status',
    })

    return NextResponse.json(
      { 
        isAuthenticated: false,
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}