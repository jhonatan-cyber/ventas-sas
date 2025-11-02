import { NextRequest, NextResponse } from 'next/server'
import { AdminAuthService } from '@/lib/auth/admin-auth-service'
import { checkRateLimit, getRateLimitKey, addRateLimitHeaders, rateLimitConfigs, rateLimiter } from '@/lib/utils/rate-limit'
import { adminLoginSchema } from '@/lib/validators/auth-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Parsear body una sola vez
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Error al procesar el cuerpo de la solicitud' },
        { status: 400 }
      )
    }

    // Rate limiting: identificar por email + IP
    const email = body.email || ''
    const rateLimitKey = getRateLimitKey(request, `admin_login_${email}`)
    const config = rateLimitConfigs.login
    const rateLimitResult = await checkRateLimit(rateLimitKey, config.limit, config.windowMs)

    if (!rateLimitResult.allowed) {
      logger.security('Login admin bloqueado por rate limit', {
        email,
        ip: request.ip || request.headers.get('x-forwarded-for'),
      })
      
      // Registrar rate limit excedido en auditoría
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: undefined,
          actionType: 'RATE_LIMIT_EXCEEDED',
          details: {
            endpoint: 'admin_login',
            identifier: email,
          },
        },
        request
      )
      
      const response = NextResponse.json(
        { 
          error: config.message,
          retryAfter: rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : null
        },
        { status: 429 }
      )
      
      return addRateLimitHeaders(
        response,
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        config.limit
      )
    }

    // Validar datos con Zod (usando body ya parseado)
    const validation = await validateRequestBody(adminLoginSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const { email: validatedEmail, password } = validation.data

    logger.debug('Intento de login admin', { email: validatedEmail })
    const result = await AdminAuthService.login({ 
      email: validatedEmail, 
      password,
      request 
    })

    // Registrar intento de login en auditoría
    await SecurityAuditLogger.logLoginAttempt(
      {
        userId: result.user?.id,
        method: 'email',
        identifier: validatedEmail,
        success: result.success,
        errorMessage: result.success ? undefined : result.error,
      },
      request
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Si requiere 2FA, retornar respuesta especial
    if (result.requires2FA && result.tempToken) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken: result.tempToken,
        message: 'Ingresa el código de tu app authenticator',
      }, { status: 200 })
    }

    // Login exitoso: resetear rate limit
    rateLimiter.reset(rateLimitKey)

    // Responder OK y dejar que el cliente redirija
    const response = NextResponse.json({ success: true, user: result.user, redirect: '/administracion/dashboard' }, { status: 200 })

    // Agregar headers de rate limit a la respuesta exitosa
    addRateLimitHeaders(
      response,
      config.limit,
      null,
      config.limit
    )

    if (result.token) {
      logger.debug('Cookie admin-auth-token establecida')
      response.cookies.set('admin-auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
    }
    logger.debug('Login admin exitoso, redirigiendo a dashboard')
    return response

  } catch (error) {
    logger.error('Error en login API admin', error as Error, {
      endpoint: '/api/administracion/login',
    })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

