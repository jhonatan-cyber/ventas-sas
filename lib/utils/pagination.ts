/**
 * Utilidades para paginación cursor-based
 * 
 * La paginación cursor-based es más eficiente que offset-based
 * para grandes datasets porque:
 * - No necesita contar todos los registros
 * - Performance constante independiente del offset
 * - No se ve afectado por nuevos registros insertados
 */

export interface CursorPaginationOptions {
  limit?: number
  cursor?: string
  orderBy?: {
    field: string
    direction?: 'asc' | 'desc'
  }
}

export interface CursorPaginationResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Codifica un cursor desde un valor
 */
export function encodeCursor(value: string | number | Date): string {
  if (value instanceof Date) {
    return Buffer.from(JSON.stringify({ date: value.toISOString() })).toString('base64url')
  }
  return Buffer.from(JSON.stringify({ value: String(value) })).toString('base64url')
}

/**
 * Decodifica un cursor a su valor original
 */
export function decodeCursor(cursor: string): { value?: string; date?: string } {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'))
  } catch {
    throw new Error('Invalid cursor format')
  }
}

/**
 * Obtiene el cursor desde un objeto basado en el campo de ordenamiento
 */
export function getCursorFromItem<T extends Record<string, any>>(
  item: T,
  orderByField: string
): string {
  const value = item[orderByField]
  
  if (value === null || value === undefined) {
    // Si el campo es null, usar el ID como fallback
    return encodeCursor(item.id || '')
  }
  
  if (value instanceof Date) {
    return encodeCursor(value)
  }
  
  return encodeCursor(value)
}

/**
 * Construye el where clause para cursor-based pagination
 */
export function buildCursorWhere(
  cursor: string | undefined,
  orderByField: string,
  direction: 'asc' | 'desc' = 'desc'
): Record<string, any> {
  if (!cursor) {
    return {}
  }

  const decoded = decodeCursor(cursor)
  const value = decoded.date ? new Date(decoded.date) : decoded.value

  if (!value) {
    return {}
  }

  // Para campos de fecha
  if (decoded.date) {
    return direction === 'desc'
      ? { [orderByField]: { lt: new Date(decoded.date) } }
      : { [orderByField]: { gt: new Date(decoded.date) } }
  }

  // Para campos string/number, usar ID como fallback si hay igualdad
  if (decoded.value) {
    // Si es un ID o valor único, usamos comparación directa
    if (direction === 'desc') {
      return {
        OR: [
          { [orderByField]: { lt: value } },
          { [orderByField]: value, id: { lt: decoded.value } }, // Fallback con ID para desempate
        ],
      }
    } else {
      return {
        OR: [
          { [orderByField]: { gt: value } },
          { [orderByField]: value, id: { gt: decoded.value } },
        ],
      }
    }
  }

  return {}
}

/**
 * Helper para crear respuesta de paginación cursor-based
 */
export function createCursorResponse<T extends Record<string, any>>(
  data: T[],
  orderByField: string,
  limit: number
): CursorPaginationResult<T> {
  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, limit) : data
  const nextCursor = items.length > 0 
    ? getCursorFromItem(items[items.length - 1], orderByField)
    : null

  return {
    data: items,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  }
}

/**
 * Tipo para parámetros de paginación desde query string
 */
export interface PaginationParams {
  limit?: number
  cursor?: string
}

/**
 * Parsea parámetros de paginación desde NextRequest
 */
export function parsePaginationParams(request: { url: string }): PaginationParams {
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)
  const cursor = url.searchParams.get('cursor') || undefined

  return {
    limit: Math.min(Math.max(1, limit), 100), // Limitar entre 1 y 100
    cursor,
  }
}

/**
 * Helper para agregar headers de paginación a la respuesta
 */
export function addPaginationHeaders(
  response: Response,
  hasMore: boolean,
  nextCursor: string | null
): Response {
  if (hasMore && nextCursor) {
    response.headers.set('X-Has-More', 'true')
    response.headers.set('X-Next-Cursor', nextCursor)
  } else {
    response.headers.set('X-Has-More', 'false')
  }

  return response
}

