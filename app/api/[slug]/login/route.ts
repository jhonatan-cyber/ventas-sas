import { NextRequest, NextResponse } from 'next/server'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getRateLimitKey, addRateLimitHeaders, rateLimitConfigs, rateLimiter } from '@/lib/utils/rate-limit'
import { sasLoginSchema } from '@/lib/validators/auth-validators'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

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

    // Rate limiting: identificar por slug + IP
    const rateLimitKey = getRateLimitKey(request, `sas_login_${slug}`)
    const config = rateLimitConfigs.login
    const rateLimitResult = await checkRateLimit(rateLimitKey, config.limit, config.windowMs)

    if (!rateLimitResult.allowed) {
      logger.security('Login SAS bloqueado por rate limit', {
        slug,
        ip: request.ip || request.headers.get('x-forwarded-for'),
        identifier: body.ci || body.correo,
      })
      
      // Registrar rate limit excedido en auditoría
      await SecurityAuditLogger.logSensitiveAction(
        {
          userId: undefined,
          actionType: 'RATE_LIMIT_EXCEEDED',
          details: {
            endpoint: 'sas_login',
            slug,
            identifier: body.ci || body.correo,
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
    const validation = await validateRequestBody(sasLoginSchema, body)
    if (!validation.success) {
      return validation.response
    }

    const { ci, correo, contraseña } = validation.data

    // Intentar login
    const result = await AuthSasService.login(slug, { ci, correo, contraseña }, request)

    // Si requiere 2FA, retornar respuesta especial
    if (result.requires2FA && result.tempToken) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken: result.tempToken,
        message: 'Ingresa el código de tu app authenticator',
      }, { status: 200 })
    }

    // Obtener organizationId para logging y validación
    const organizationId = result.user?.organization?.id

    // Registrar intento de login en auditoría
    await SecurityAuditLogger.logLoginAttempt(
      {
        userId: result.user?.id,
        organizationId: organizationId,
        method: ci ? 'CI' : 'email',
        identifier: ci || correo,
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

    // Validar que el usuario tenga organización asociada
    // La validación de suscripción activa ya se hizo en getOrganizationBySlug dentro de AuthSasService
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cuenta sin organización asociada. Contacta a soporte.' },
        { status: 403 }
      )
    }

    // Login exitoso: resetear rate limit
    rateLimiter.reset(rateLimitKey)
    
    // Crear cookie de sesión para el sistema SAS
    const response = NextResponse.json(
      { 
        success: true, 
        user: result.user,
        redirect: `/${slug}/dashboard`
      },
      { status: 200 }
    )

    // Agregar headers de rate limit a la respuesta exitosa
    addRateLimitHeaders(
      response,
      config.limit,
      null,
      config.limit
    )

    if (result.token) {
      const isSecure = request.nextUrl.protocol === 'https:'
      // Guardar sesión en cookie
      const sessionData = {
        userId: result.user.id,
        nombre: result.user.nombre,
        apellido: result.user.apellido,
        fullName: `${result.user.nombre} ${result.user.apellido}`,
        correo: result.user.correo,
        rol: result.user.rol?.nombre || null,
        organizationSlug: slug,
        organizationId: organizationId,
        sucursalId: result.user.sucursal?.id || null,
        lastUpdated: Date.now(),
      }

      // Establecer cookies con configuración mejorada (valor codificado en base64 para evitar errores de parseo)
      const sessionEncoded = Buffer.from(JSON.stringify(sessionData), 'utf8').toString('base64')
      response.cookies.set('sas-session', sessionEncoded, {
        httpOnly: false, // Necesitamos acceder desde el cliente
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })

      // Token JWT para validaciones del servidor (SAS)
      response.cookies.set('sas-auth-token', result.token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
    }

    return response

  } catch (error) {
    logger.error('Error en login API SAS', error as Error, {
      endpoint: `/api/${slug}/login`,
      slug,
    })
    console.error('Error completo en login SAS:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available')
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

