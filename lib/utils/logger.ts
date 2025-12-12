/**
 * Sistema de Logging Estructurado
 * 
 * Implementación simple de logging sin dependencias externas
 * En desarrollo, usa formato pretty para legibilidad
 * En producción, solo muestra errores y warnings
 */

// Determinar nivel de logging según ambiente
const getLogLevel = (): number => {
  const levelMap: Record<string, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  }
  
  if (process.env.NODE_ENV === 'production') {
    const level = process.env.LOG_LEVEL || 'warn'
    return levelMap[level] || 30
  }
  const level = process.env.LOG_LEVEL || 'debug'
  return levelMap[level] || 10
}

const currentLogLevel = getLogLevel()

// Función para redactar información sensible
const redactSensitiveData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sensitiveKeys = [
    'password', 'contraseña', 'token', 'authToken', 'secret', 'secretKey',
    'apiKey', 'apikey', 'authorization', 'cookie'
  ]
  
  const redacted = { ...obj }
  
  for (const key in redacted) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key])
    }
  }
  
  return redacted
}

// Función para formatear logs
const formatLog = (level: string, message: string, data?: Record<string, any>) => {
  const timestamp = new Date().toISOString()
  const baseLog = {
    timestamp,
    level,
    service: 'ventas-sas',
    env: process.env.NODE_ENV || 'development',
    message,
  }
  
  if (data && Object.keys(data).length > 0) {
    const cleanData = redactSensitiveData(data)
    return { ...baseLog, ...cleanData }
  }
  
  return baseLog
}

// Logger simple sin dependencias externas
const simpleLogger = {
  debug: (data: Record<string, any>, message: string) => {
    if (currentLogLevel <= 10) {
      const log = formatLog('debug', message, data)
      if (typeof window === 'undefined') {
        console.debug(JSON.stringify(log))
      } else {
        console.debug(`[DEBUG] ${message}`, Object.keys(data).length > 0 ? data : undefined)
      }
    }
  },
  
  info: (data: Record<string, any>, message: string) => {
    if (currentLogLevel <= 20) {
      const log = formatLog('info', message, data)
      if (typeof window === 'undefined') {
        console.info(JSON.stringify(log))
      } else {
        console.info(`[INFO] ${message}`, Object.keys(data).length > 0 ? data : undefined)
      }
    }
  },
  
  warn: (data: Record<string, any>, message: string) => {
    if (currentLogLevel <= 30) {
      const log = formatLog('warn', message, data)
      if (typeof window === 'undefined') {
        console.warn(JSON.stringify(log))
      } else {
        console.warn(`[WARN] ${message}`, Object.keys(data).length > 0 ? data : undefined)
      }
    }
  },
  
  error: (data: Record<string, any>, message: string) => {
    if (currentLogLevel <= 40) {
      const log = formatLog('error', message, data)
      if (typeof window === 'undefined') {
        console.error(JSON.stringify(log))
      } else {
        console.error(`[ERROR] ${message}`, Object.keys(data).length > 0 ? data : undefined)
      }
    }
  }
}

/**
 * Logger estructurado para la aplicación
 */
export const logger = {
  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      simpleLogger.debug(data || {}, message)
    }
  },

  /**
   * Log de información
   */
  info: (message: string, data?: Record<string, any>) => {
    simpleLogger.info(data || {}, message)
  },

  /**
   * Log de advertencia
   */
  warn: (message: string, data?: Record<string, any>) => {
    simpleLogger.warn(data || {}, message)
  },

  /**
   * Log de error
   */
  error: (message: string, error?: Error | unknown, data?: Record<string, any>) => {
    // Filtrar propiedades undefined del objeto data
    const cleanData = data ? Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    ) : {}
    
    if (error instanceof Error) {
      // Construir objeto error con información mínima garantizada
      const errorMessage = error.message?.trim() || 'Error sin mensaje'
      const errorName = error.name || 'Error'
      
      const errorObj: Record<string, any> = {
        message: errorMessage,
        name: errorName,
      }
      
      // Solo incluir stack en desarrollo
      if (process.env.NODE_ENV === 'development' && error.stack) {
        errorObj.stack = error.stack
      }
      
      // Construir el objeto final siempre con el objeto error
      const logObj: Record<string, any> = { error: errorObj }
      
      // Solo agregar datos adicionales si existen, no son undefined, y tienen contenido
      Object.keys(cleanData).forEach(key => {
        const value = cleanData[key]
        if (value !== undefined && value !== null) {
          // Verificar que el valor tenga contenido útil
          if (typeof value === 'string' && value.trim() !== '') {
            logObj[key] = value
          } else if (typeof value === 'object') {
            // Solo incluir objetos que no estén vacíos
            if (Array.isArray(value) && value.length > 0) {
              logObj[key] = value
            } else if (!Array.isArray(value) && Object.keys(value).length > 0) {
              logObj[key] = value
            }
          } else {
            logObj[key] = value
          }
        }
      })
      
      simpleLogger.error(logObj, message)
    } else {
      // Para errores que no son instancias de Error
      const logObj: Record<string, any> = {}
      
      // Agregar datos limpios si existen
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] !== undefined) {
          logObj[key] = cleanData[key]
        }
      })
      
      // Agregar información del error si está disponible
      if (error !== undefined && error !== null) {
        logObj.error = typeof error === 'object' ? error : { message: String(error) }
      }
      
      // Solo pasar objeto si tiene propiedades, de lo contrario solo el mensaje
      if (Object.keys(logObj).length > 0) {
        simpleLogger.error(logObj, message)
      } else {
        simpleLogger.error({}, message)
      }
    }
  },

  /**
   * Log de seguridad (siempre registrado)
   */
  security: (message: string, data?: Record<string, any>) => {
    simpleLogger.warn({ ...data, type: 'security' }, `[SECURITY] ${message}`)
  },

  /**
   * Log de performance
   */
  performance: (message: string, duration: number, data?: Record<string, any>) => {
    if (process.env.LOG_PERFORMANCE === 'true' || process.env.NODE_ENV === 'development') {
      simpleLogger.info({ ...data, duration, type: 'performance' }, `[PERF] ${message}`)
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

