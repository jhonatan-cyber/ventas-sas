/**
 * Sistema de Logging Estructurado
 * 
 * Usa Pino para logging estructurado en formato JSON
 * En desarrollo, usa formato pretty para legibilidad
 * En producción, solo muestra errores y warnings
 */

import pino from 'pino'

// Determinar nivel de logging según ambiente
const getLogLevel = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.LOG_LEVEL || 'warn' // Solo warnings y errores en producción
  }
  return process.env.LOG_LEVEL || 'debug' // Debug completo en desarrollo
}

// Configuración del logger
const loggerConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'ventas-sas',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'contraseña',
      'token',
      'authToken',
      'secret',
      'secretKey',
      'apiKey',
      'apikey',
      'authorization',
      'cookie',
      '*.password',
      '*.token',
      '*.secret',
    ],
    remove: true,
  },
}

// Crear logger base
const pinoLogger = pino(
  loggerConfig,
  // En desarrollo, usar stdout para formato legible
  // En producción, usar stdout para JSON (para Docker/Kubernetes)
  process.stdout
)

/**
 * Logger estructurado para la aplicación
 */
export const logger = {
  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      pinoLogger.debug(data || {}, message)
    }
  },

  /**
   * Log de información
   */
  info: (message: string, data?: Record<string, any>) => {
    pinoLogger.info(data || {}, message)
  },

  /**
   * Log de advertencia
   */
  warn: (message: string, data?: Record<string, any>) => {
    pinoLogger.warn(data || {}, message)
  },

  /**
   * Log de error
   */
  error: (message: string, error?: Error | unknown, data?: Record<string, any>) => {
    if (error instanceof Error) {
      pinoLogger.error(
        {
          ...data,
          error: {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            name: error.name,
          },
        },
        message
      )
    } else {
      pinoLogger.error(data || {}, message, error)
    }
  },

  /**
   * Log de seguridad (siempre registrado)
   */
  security: (message: string, data?: Record<string, any>) => {
    pinoLogger.warn({ ...data, type: 'security' }, `[SECURITY] ${message}`)
  },

  /**
   * Log de performance
   */
  performance: (message: string, duration: number, data?: Record<string, any>) => {
    if (process.env.LOG_PERFORMANCE === 'true' || process.env.NODE_ENV === 'development') {
      pinoLogger.info({ ...data, duration, type: 'performance' }, `[PERF] ${message}`)
    }
  },
}

/**
 * Helper para crear contexto de logging con correlation ID
 */
let correlationIdCounter = 0

export function generateCorrelationId(): string {
  correlationIdCounter++
  return `${Date.now()}-${correlationIdCounter}-${Math.random().toString(36).substring(7)}`
}

export function createLogContext(additionalData?: Record<string, any>) {
  return {
    timestamp: new Date().toISOString(),
    correlationId: additionalData?.correlationId || generateCorrelationId(),
    ...additionalData,
  }
}

/**
 * Helper para logging de requests HTTP
 */
export function logRequest(
  method: string,
  path: string,
  statusCode?: number,
  duration?: number,
  additionalData?: Record<string, any>
) {
  const level = statusCode && statusCode >= 500 ? 'error' : statusCode && statusCode >= 400 ? 'warn' : 'info'
  const message = `${method} ${path}${statusCode ? ` ${statusCode}` : ''}${duration ? ` ${duration}ms` : ''}`
  
  logger[level](message, {
    type: 'http',
    method,
    path,
    statusCode,
    duration,
    ...additionalData,
  })
}

/**
 * Helper para logging de operaciones de BD con contexto enriquecido
 */
export function logDatabase(
  operation: string,
  table?: string,
  duration?: number,
  error?: Error,
  additionalData?: Record<string, any>
) {
  const isSlow = duration && duration > 500 // Operaciones > 500ms son lentas
  
  if (error) {
    logger.error(`[DB] ${operation}${table ? ` on ${table}` : ''}`, error, {
      type: 'database',
      operation,
      table,
      duration,
      isSlow,
      ...additionalData,
    })
  } else if (isSlow) {
    // Log como warning si es lenta pero exitosa
    logger.warn(`[SLOW DB] ${operation}${table ? ` on ${table}` : ''} (${duration}ms)`, {
      type: 'database',
      operation,
      table,
      duration,
      threshold: 500,
      ...additionalData,
    })
  } else {
    logger.debug(`[DB] ${operation}${table ? ` on ${table}` : ''}${duration ? ` (${duration}ms)` : ''}`, {
      type: 'database',
      operation,
      table,
      duration,
      ...additionalData,
    })
  }
}

/**
 * Helper para logging de operaciones de negocio
 */
export function logBusinessOperation(
  operation: string,
  entity: string,
  entityId?: string,
  userId?: string,
  additionalData?: Record<string, any>
) {
  logger.info(`[BUSINESS] ${operation} on ${entity}${entityId ? ` (${entityId})` : ''}`, {
    type: 'business',
    operation,
    entity,
    entityId,
    userId,
    ...additionalData,
  })
}

/**
 * Helper para logging de cambios de estado
 */
export function logStateChange(
  entity: string,
  entityId: string,
  oldState: string,
  newState: string,
  userId?: string,
  additionalData?: Record<string, any>
) {
  logger.info(`[STATE CHANGE] ${entity} ${entityId}: ${oldState} → ${newState}`, {
    type: 'state-change',
    entity,
    entityId,
    oldState,
    newState,
    userId,
    ...additionalData,
  })
}

export default logger

