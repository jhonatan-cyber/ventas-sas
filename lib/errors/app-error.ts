/**
 * Error personalizado de la aplicación
 * Permite definir errores con código de estado HTTP y mensaje específico
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string
  public readonly details?: any

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message)
    
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code
    this.details = details
    
    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor)
    
    // Asegurar que el nombre de la clase sea correcto
    this.name = this.constructor.name
  }

  /**
   * Crea un error de validación (400)
   */
  static validation(message: string, details?: any): AppError {
    return new AppError(400, message, true, 'VALIDATION_ERROR', details)
  }

  /**
   * Crea un error de autenticación (401)
   */
  static unauthorized(message: string = 'No autorizado'): AppError {
    return new AppError(401, message, true, 'UNAUTHORIZED')
  }

  /**
   * Crea un error de permisos (403)
   */
  static forbidden(message: string = 'Acceso denegado'): AppError {
    return new AppError(403, message, true, 'FORBIDDEN')
  }

  /**
   * Crea un error de recurso no encontrado (404)
   */
  static notFound(message: string = 'Recurso no encontrado'): AppError {
    return new AppError(404, message, true, 'NOT_FOUND')
  }

  /**
   * Crea un error de conflicto (409)
   */
  static conflict(message: string, details?: any): AppError {
    return new AppError(409, message, true, 'CONFLICT', details)
  }

  /**
   * Crea un error de límite de tasa excedido (429)
   */
  static tooManyRequests(message: string = 'Demasiadas solicitudes'): AppError {
    return new AppError(429, message, true, 'TOO_MANY_REQUESTS')
  }

  /**
   * Crea un error interno del servidor (500)
   */
  static internal(message: string = 'Error interno del servidor', details?: any): AppError {
    return new AppError(500, message, false, 'INTERNAL_ERROR', details)
  }

  /**
   * Convierte el error a formato JSON para respuesta HTTP
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details })
    }
  }
}

