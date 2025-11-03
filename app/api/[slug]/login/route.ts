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

    // Obtener customerId para logging y validación
    const customerId = result.user?.customer?.id

    // Registrar intento de login en auditoría
    await SecurityAuditLogger.logLoginAttempt(
      {
        userId: result.user?.id,
        customerId: customerId,
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

    // Validar suscripción activa del cliente asociado al usuario SAS
    if (!customerId) {
      return NextResponse.json(
        { error: 'Cuenta sin cliente asociado. Contacta a soporte.' },
        { status: 403 }
      )
    }

    const activeSub = await prisma.subscription.findFirst({
      where: {
        customerId,
        status: { in: ['active', 'trial'] },
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, endDate: true },
    })

    if (!activeSub) {
      return NextResponse.json(
        { error: 'Tu suscripción no está activa. Por favor, contacta a tu proveedor de servicio.' },
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
      // Guardar sesión en cookie
      const sessionData = {
        userId: result.user.id,
        nombre: result.user.nombre,
        apellido: result.user.apellido,
        fullName: `${result.user.nombre} ${result.user.apellido}`,
        correo: result.user.correo,
        rol: result.user.rol?.nombre || null,
        customerSlug: slug,
        customerId,
        sucursalId: result.user.sucursal?.id || null,
      }

      // Establecer cookies con configuración mejorada (valor codificado en base64 para evitar errores de parseo)
      const sessionEncoded = Buffer.from(JSON.stringify(sessionData), 'utf8').toString('base64')
      response.cookies.set('sas-session', sessionEncoded, {
        httpOnly: false, // Necesitamos acceder desde el cliente
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })

      // Token JWT para validaciones del servidor (SAS)
      response.cookies.set('sas-auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

