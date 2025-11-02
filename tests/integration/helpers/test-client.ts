/**
 * Cliente HTTP para testing de APIs
 * 
 * Simula requests de Next.js API routes
 */

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export interface TestRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  cookies?: Record<string, string>
  params?: Record<string, string>
  searchParams?: Record<string, string>
}

/**
 * Crea un NextRequest simulado para testing
 */
export function createTestRequest(
  url: string,
  options: TestRequestOptions = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    cookies: cookieData = {},
    searchParams = {},
  } = options

  // Construir URL con search params
  const urlObj = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, String(value))
  })

  const request = new NextRequest(urlObj.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && {
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  })

  // Agregar cookies al request
  if (Object.keys(cookieData).length > 0) {
    const cookieHeader = Object.entries(cookieData)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    request.headers.set('Cookie', cookieHeader)
  }

  return request
}

/**
 * Helper para ejecutar una API route handler
 */
export async function testApiRoute(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  url: string,
  options: TestRequestOptions = {}
): Promise<Response> {
  const request = createTestRequest(url, options)
  
  // Mock params si se proporcionan
  let context = {}
  if (options.params) {
    context = {
      params: Promise.resolve(options.params),
    }
  }

  return await handler(request, context)
}

/**
 * Helper para parsear respuesta JSON
 */
export async function parseJsonResponse(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'Invalid JSON response', raw: text }
  }
}

/**
 * Helper para extraer cookie de response
 */
export function getCookieFromResponse(response: Response, name: string): string | null {
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) return null

  const cookies = setCookieHeader.split(',').map(c => c.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return cookie.split(';')[0].split('=')[1]
    }
  }
  return null
}

