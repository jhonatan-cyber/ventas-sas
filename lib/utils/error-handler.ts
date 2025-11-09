import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/lib/errors/app-error'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { logger } from './logger'
import { getRequestContext } from './request-context'

/**
 * Tipos de error conocidos
 */
type ErrorType = 
  | AppError
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientUnknownRequestError
  | Prisma.PrismaClientValidationError
  | ZodError
  | Error

/**
 * Contexto opcional para el manejo de errores
 */
export interface ErrorContext {
  request?: NextRequest
  endpoint?: string
  userId?: string
  organizationId?: string
  customerId?: string
  action?: string
}

/**
 * Mapea errores de Prisma a mensajes legibles en español
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Violación de constraint único
      const target = error.meta?.target as string[] | undefined
      const field = target?.[0] || 'campo'
      return AppError.conflict(`Ya existe un registro con ese ${field}`)
    
    case 'P2025':
      // Registro no encontrado
      return AppError.notFound('El registro solicitado no existe')
    
    case 'P2003':
      // Violación de foreign key
      return AppError.validation('No se puede realizar la operación. Existen referencias relacionadas')
    
    case 'P2014':
      // Violación de constraint de relación
      return AppError.validation('No se puede realizar la operación debido a restricciones de relación')
    
    case 'P2016':
      // Error de interpretación de query
      return AppError.internal('Error en la consulta a la base de datos')
    
    case 'P2021':
      // Tabla no existe
      return AppError.internal('Error en la estructura de la base de datos')
    
    case 'P2022':
      // Columna no existe
      return AppError.internal('Error en la estructura de la base de datos')
    
    default:
      // Otro error de Prisma
      return AppError.internal(
        'Error al procesar la solicitud en la base de datos',
        process.env.NODE_ENV === 'development' ? { code: error.code, meta: error.meta } : undefined
      )
  }
}

/**
 * Mapea errores de Zod a formato legible
 */
function handleZodError(error: ZodError): NextResponse {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))

  return NextResponse.json(
    {
      error: 'Error de validación',
      details: errors
    },
    { status: 400 }
  )
}

/**
 * Loggea el error de forma estructurada con contexto enriquecido
 */
function logError(error: ErrorType, context?: ErrorContext) {
  // Obtener contexto del request si está disponible
  const requestContext = context?.request ? getRequestContext(context.request) : {}
  
  const logData: any = {
    timestamp: new Date().toISOString(),
    correlationId: requestContext.correlationId,
    error: {
      name: error.name,
      message: error.message
    }
  }

  // Agregar contexto si está disponible
  if (context) {
    if (context.endpoint) logData.endpoint = context.endpoint
    if (context.userId) logData.userId = context.userId
    if (context.organizationId) logData.organizationId = context.organizationId
    if (context.customerId) logData.customerId = context.customerId
    if (context.action) logData.action = context.action
    if (context.request) {
      logData.ip = context.request.ip || context.request.headers.get('x-forwarded-for') || 'unknown'
      logData.userAgent = context.request.headers.get('user-agent')
    }
  }

  // Agregar información adicional según el tipo de error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logData.error.code = error.code
    logData.error.meta = error.meta
  }

  if (error instanceof ZodError) {
    logData.error.errors = error.errors
  }

  // Usar logger estructurado
  logger.error('API Error', error instanceof Error ? error : new Error(String(error)), {
    ...logData,
    endpoint: context?.endpoint,
    userId: context?.userId,
    organizationId: context?.organizationId,
    customerId: context?.customerId,
    action: context?.action,
  })
}

/**
 * Maneja errores de manera centralizada y retorna una respuesta HTTP apropiada
 * 
 * @param error - El error capturado
 * @param context - Contexto opcional del error
 * @returns NextResponse con el error formateado
 */
export function handleApiError(
  error: unknown,
  context?: ErrorContext
): NextResponse {
  // Convertir error desconocido a Error
  const apiError = error instanceof Error ? error : new Error(String(error))

  // Log del error
  logError(apiError, context)

  // Manejar errores de AppError (errores controlados)
  if (apiError instanceof AppError) {
    return NextResponse.json(
      apiError.toJSON(),
      { status: apiError.statusCode }
    )
  }

  // Manejar errores de Prisma
  if (apiError instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(apiError)
    return NextResponse.json(
      appError.toJSON(),
      { status: appError.statusCode }
    )
  }

  if (apiError instanceof Prisma.PrismaClientUnknownRequestError) {
    return NextResponse.json(
      AppError.internal('Error desconocido en la base de datos').toJSON(),
      { status: 500 }
    )
  }

  if (apiError instanceof Prisma.PrismaClientValidationError) {
    const validationError = AppError.validation('Error de validación en los datos enviados', {
      message: apiError.message,
    })
    return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode })
  }

  // Manejar errores de Zod
  if (apiError instanceof ZodError) {
    return handleZodError(apiError)
  }

  // Error genérico no manejado
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'development' 
        ? apiError.message 
        : 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack })
    },
    { status: 500 }
  )
}

/**
 * Wrapper para manejar errores en handlers de API routes
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   return handleApiRoute(async () => {
 *     // Tu código aquí
 *     return NextResponse.json({ success: true })
 *   }, { endpoint: '/api/users' })
 * }
 */
export async function handleApiRoute<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: ErrorContext
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return handleApiError(error, context)
  }
}

/**
 * Helper para crear contexto de error desde un request
 */
export function createErrorContext(
  request: NextRequest,
  params?: { userId?: string; organizationId?: string; customerId?: string; action?: string }
): ErrorContext {
  return {
    request,
    endpoint: new URL(request.url).pathname,
    ...params
  }
}

