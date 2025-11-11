import { NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'

/**
 * Helper para validar y manejar errores de Zod
 */

export interface ValidationError {
  field: string
  message: string
}

/**
 * Valida datos contra un schema de Zod y retorna el resultado parseado
 * @param schema - Schema de Zod
 * @param data - Datos a validar
 * @returns Objeto con success, data (si es exitoso) o errors (si falla)
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
    
    // Error inesperado
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Error de validación desconocido' }]
    }
  }
}

/**
 * Valida datos y retorna una respuesta HTTP 400 si hay errores
 * @param schema - Schema de Zod
 * @param data - Datos a validar
 * @returns null si es válido, NextResponse con error si no
 */
export function validateAndReturnError<T>(
  schema: ZodSchema<T>,
  data: unknown
): NextResponse | null {
  const result = validateData(schema, data)
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Datos inválidos',
        details: result.errors,
        // Formato más amigable para el frontend
        errors: result.errors.reduce(
          (acc, err) => {
            acc[err.field] = err.message
            return acc
          },
          {} as Record<string, string>
        )
      },
      { status: 400 }
    )
  }
  
  return null
}

/**
 * Formatea errores de Zod para mostrar al usuario
 */
export function formatZodErrors(error: ZodError): string {
  return error.errors
    .map((err) => {
      const field = err.path.join('.')
      return `${field}: ${err.message}`
    })
    .join(', ')
}

/**
 * Obtiene el primer error de validación
 */
export function getFirstValidationError(
  errors: ValidationError[]
): string {
  if (errors.length === 0) return 'Error de validación desconocido'
  return errors[0].message
}

/**
 * Middleware helper para validar body de request
 * Acepta body ya parseado o request para parsearlo
 */
export async function validateRequestBody<T>(
  schema: ZodSchema<T>,
  requestOrBody: Request | unknown
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    let body: unknown
    
    // Si es un Request, parsearlo. Si no, usar directamente
    if (requestOrBody instanceof Request) {
      body = await requestOrBody.json()
    } else {
      body = requestOrBody
    }
    
    const validation = validateData(schema, body)
    
    if (!validation.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Datos inválidos',
            details: validation.errors,
            errors: validation.errors.reduce(
              (acc, err) => {
                acc[err.field] = err.message
                return acc
              },
              {} as Record<string, string>
            )
          },
          { status: 400 }
        )
      }
    }
    
    return { success: true, data: validation.data }
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Error al procesar el cuerpo de la solicitud' },
        { status: 400 }
      )
    }
  }
}

