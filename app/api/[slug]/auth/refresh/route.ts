/**
 * API de Refresh de Tokens - Sistema de Autenticación Empresarial
 * 
 * Maneja la renovación automática de access tokens usando refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { logger } from '@/lib/utils/logger'

export async function POST(
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

    // Obtener refresh token de las cookies
    const refreshToken = request.cookies.get("Sas-refresh-token")?.value
    const accessToken = request.cookies.get("Sas-auth-token")?.value

    console.log('🔄 API Refresh - Debug:', {
      slug,
      hasRefreshToken: !!refreshToken,
      hasAccessToken: !!accessToken,
      refreshTokenLength: refreshToken?.length,
      accessTokenLength: accessToken?.length,
      allCookies: request.cookies.getAll().reduce((acc, cookie) => ({
        ...acc,
        [cookie.name]: cookie.value.length
      }), {})
    })

    if (!refreshToken) {
      console.log('❌ API Refresh - No refresh token encontrado')
      return NextResponse.json(
        {
          error: 'Refresh token no encontrado',
          requiresReauth: true
        },
        { status: 401 }
      )
    }

    // Intentar refrescar tokens
    console.log('🔄 API Refresh - Intentando refrescar tokens...')
    const result = await EnhancedTokenService.refreshTokens(refreshToken, request)

    console.log('🔄 API Refresh - Resultado:', {
      success: result.success,
      error: result.error,
      requiresReauth: result.requiresReauth,
      hasTokens: !!result.tokens
    })

    if (!result.success) {
      // Limpiar cookies si el refresh falló
      const response = NextResponse.json(
        {
          error: result.error,
          requiresReauth: result.requiresReauth
        },
        { status: 401 }
      )

      if (result.requiresReauth) {
        // Limpiar todas las cookies de autenticación
        const cookieOptions = {
          httpOnly: true,
          secure: request.nextUrl.protocol === 'https:',
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 0,
        }

        response.cookies.set('sas-auth-token', '', cookieOptions)
        response.cookies.set('sas-refresh-token', '', cookieOptions)
        response.cookies.set('sas-session', '', { ...cookieOptions, httpOnly: false })
      }

      return response
    }

    // Refresh exitoso - establecer nuevas cookies
    const response = NextResponse.json({
      success: true,
      expiresAt: new Date(Date.now() + result.tokens!.expiresIn * 1000).toISOString(),
      message: 'Tokens refrescados correctamente'
    })

    const isSecure = request.nextUrl.protocol === 'https:'

    // Establecer nuevas cookies
    response.cookies.set('sas-auth-token', result.tokens!.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: result.tokens!.expiresIn,
      path: '/',
    })

    response.cookies.set('sas-refresh-token', result.tokens!.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: result.tokens!.refreshExpiresIn,
      path: '/',
    })

    // Actualizar session cookie para compatibilidad
    try {
      const existingSession = request.cookies.get("sas-session")?.value
      if (existingSession) {
        const sessionData = JSON.parse(Buffer.from(existingSession, 'base64').toString('utf8'))
        sessionData.lastUpdated = Date.now()
        sessionData.sessionId = result.tokens!.sessionId

        const sessionEncoded = Buffer.from(JSON.stringify(sessionData), 'utf8').toString('base64')
        response.cookies.set('sas-session', sessionEncoded, {
          httpOnly: false,
          secure: isSecure,
          sameSite: 'lax',
          maxAge: result.tokens!.refreshExpiresIn,
          path: '/',
        })
      }
    } catch (error) {
      // Si falla la actualización de session, no es crítico
      logger.warn('Error actualizando session cookie durante refresh', error as Error)
    }

    return response

  } catch (error) {
    console.error('🔥 CRITICAL ERROR IN /api/[slug]/auth/refresh:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
      console.error('Name:', error.name)
      console.error('Message:', error.message)
    }

    logger.error('Error en refresh de tokens', error as Error, {
      endpoint: '/api/[slug]/auth/refresh',
    })

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        requiresReauth: true
      },
      { status: 500 }
    )
  }
}