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
// En el navegador, Pino necesita una configuración diferente
const pinoLogger = typeof window === 'undefined'
  ? pino(loggerConfig, process.stdout)
  : pino({
      ...loggerConfig,
      browser: {
        asObject: true,
        write: (o: any) => {
          // En el navegador, formatear el log de manera legible
          const level = o.level || 'info'
          const msg = o.msg || ''
          
          // Función helper para verificar si un valor tiene contenido útil
          const hasValue = (value: any): boolean => {
            if (value === undefined || value === null) return false
            if (typeof value === 'string' && value.trim() === '') return false
            if (Array.isArray(value) && value.length === 0) return false
            if (typeof value === 'object') {
              // Si es un objeto, verificar si tiene propiedades con valores
              const keys = Object.keys(value)
              if (keys.length === 0) return false
              // Verificar si al menos una propiedad tiene valor
              return keys.some(key => hasValue(value[key]))
            }
            return true
          }
          
          // Función helper para limpiar un objeto anidado
          const cleanNestedObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj
            const cleaned: Record<string, any> = {}
            Object.keys(obj).forEach(key => {
              const value = obj[key]
              if (hasValue(value)) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                  const nested = cleanNestedObject(value)
                  if (Object.keys(nested).length > 0) {
                    cleaned[key] = nested
                  }
                } else {
                  cleaned[key] = value
                }
              }
            })
            return cleaned
          }
          
          // Filtrar propiedades y construir objeto limpio
          const cleanObj: Record<string, any> = {}
          const excludeKeys = ['level', 'msg', 'time', 'v', 'pid', 'hostname', 'env', 'service']
          
          // Procesar cada propiedad del objeto
          Object.keys(o).forEach(key => {
            if (excludeKeys.includes(key)) return
            
            const value = o[key]
            
            // Si es el objeto 'error', asegurarse de preservarlo si tiene message o name
            if (key === 'error' && typeof value === 'object' && value !== null) {
              const errorMsg = value.message || value.msg || ''
              const errorName = value.name || ''
              // Si tiene mensaje o nombre, preservar el objeto error (aunque esté limpio)
              if (errorMsg || errorName) {
                const cleanedError: Record<string, any> = {}
                if (errorMsg) cleanedError.message = errorMsg
                if (errorName) cleanedError.name = errorName
                if (value.stack) cleanedError.stack = value.stack
                cleanObj.error = cleanedError
              }
              return
            }
            
            // Para otras propiedades, verificar si tienen valor
            if (hasValue(value)) {
              const cleanedValue = typeof value === 'object' && !Array.isArray(value)
                ? cleanNestedObject(value)
                : value
              
              // Solo agregar si el valor limpio tiene contenido
              if (hasValue(cleanedValue)) {
                cleanObj[key] = cleanedValue
              }
            }
          })
          
          const logMessage = msg || 'Error sin mensaje'
          const hasData = Object.keys(cleanObj).length > 0
          
          // Usar el método de console apropiado según el nivel
          if (level >= 50) { // error
            if (hasData) {
              console.error(`[ERROR] ${logMessage}`, cleanObj)
            } else {
              console.error(`[ERROR] ${logMessage}`)
            }
          } else if (level >= 40) { // warn
            if (hasData) {
              console.warn(`[WARN] ${logMessage}`, cleanObj)
            } else {
              console.warn(`[WARN] ${logMessage}`)
            }
          } else if (level >= 30) { // info
            if (hasData) {
              console.info(`[INFO] ${logMessage}`, cleanObj)
            } else {
              console.info(`[INFO] ${logMessage}`)
            }
          } else { // debug
            if (hasData) {
              console.debug(`[DEBUG] ${logMessage}`, cleanObj)
            } else {
              console.debug(`[DEBUG] ${logMessage}`)
            }
          }
        },
      },
    })

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
      
      pinoLogger.error(logObj, message)
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
        pinoLogger.error(logObj, message)
      } else {
        pinoLogger.error(message)
      }
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

